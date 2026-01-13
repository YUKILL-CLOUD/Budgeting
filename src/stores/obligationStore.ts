import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Obligation } from '../lib/db';
import { toast } from 'sonner';

interface ObligationStore {
    obligations: Obligation[];
    loading: boolean;
    fetchObligations: () => Promise<void>;
    addObligation: (obligation: Omit<Obligation, 'id' | 'createdAt'>) => Promise<void>;
    updateObligation: (id: number, updates: Partial<Obligation>) => Promise<void>;
    deleteObligation: (id: number) => Promise<void>;
}

export const useObligationStore = create<ObligationStore>((set, get) => ({
    obligations: [],
    loading: false,

    fetchObligations: async () => {
        set({ loading: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            set({ obligations: [], loading: false });
            return;
        }

        const { data, error } = await supabase
            .from('obligations')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching obligations:', error);
            // Don't toast error if table doesn't exist yet, we'll handle it
        } else {
            const formatted: Obligation[] = (data || []).map((o: any) => ({
                id: o.id,
                name: o.name,
                amount: Number(o.amount),
                priority: o.priority,
                createdAt: new Date(o.created_at)
            }));
            set({ obligations: formatted });
        }
        set({ loading: false });
    },

    addObligation: async (obligation) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('obligations')
            .insert({
                user_id: user.id,
                name: obligation.name,
                amount: obligation.amount,
                priority: obligation.priority
            });

        if (error) {
            console.error('Error adding obligation:', error);
            toast.error('Failed to add obligation. Make sure to run the SQL migration.');
        } else {
            await get().fetchObligations();
        }
    },

    updateObligation: async (id, updates) => {
        const { error } = await supabase
            .from('obligations')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating obligation:', error);
            toast.error('Failed to update obligation');
        } else {
            await get().fetchObligations();
        }
    },

    deleteObligation: async (id) => {
        const { error } = await supabase
            .from('obligations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting obligation:', error);
            toast.error('Failed to delete obligation');
        } else {
            await get().fetchObligations();
        }
    },
}));
