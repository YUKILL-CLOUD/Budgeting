import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Account } from '../lib/db';
import { toast } from 'sonner';

interface AccountStore {
    accounts: Account[];
    loading: boolean;
    fetchAccounts: () => Promise<void>;
    addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
    updateAccount: (id: number, updates: Partial<Account>) => Promise<void>;
    deleteAccount: (id: number) => Promise<void>;
    getTotalBalance: () => number;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
    accounts: [],
    loading: false,

    fetchAccounts: async () => {
        set({ loading: true });

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            set({ accounts: [], loading: false });
            return;
        }

        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to sync accounts');
        } else {
            set({ accounts: data as Account[] });
        }
        set({ loading: false });
    },

    addAccount: async (account) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('accounts')
            .insert({
                ...account,
                user_id: user.id
            });

        if (error) {
            console.error('Error adding account:', error);
            toast.error('Failed to add account');
        } else {
            await get().fetchAccounts();
        }
    },

    updateAccount: async (id, updates) => {
        const { error } = await supabase
            .from('accounts')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating account:', error);
            toast.error('Failed to update account');
        } else {
            await get().fetchAccounts();
        }
    },

    deleteAccount: async (id) => {
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting account:', error);
            toast.error('Failed to delete account');
        } else {
            await get().fetchAccounts();
        }
    },

    getTotalBalance: () => {
        return get().accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    },
}));
