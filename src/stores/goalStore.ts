import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Goal } from '../lib/db';
import { toast } from 'sonner';

interface GoalStore {
    goals: Goal[];
    loading: boolean;
    fetchGoals: () => Promise<void>;
    addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
    updateGoal: (id: number, updates: Partial<Goal>) => Promise<void>;
    deleteGoal: (id: number) => Promise<void>;
    checkAndRefreshGoals: () => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
    goals: [],
    loading: false,

    fetchGoals: async () => {
        set({ loading: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            set({ goals: [], loading: false });
            return;
        }

        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching goals:', error);
            toast.error('Failed to sync goals');
        } else {
            // Map snake_case DB fields to camelCase TS Interface
            const formattedGoals: Goal[] = (data || []).map((g: any) => ({
                id: g.id,
                name: g.name,
                targetAmount: Number(g.target_amount),
                currentAmount: Number(g.current_amount),
                accountId: g.account_id,
                trackingType: g.tracking_type,
                refreshType: g.refresh_type,
                monthlyPlan: Number(g.monthly_plan),
                priority: g.priority,
                deadline: g.deadline ? new Date(g.deadline) : new Date(), // Handle potential nulls safely
                status: g.status,
                lastRefreshedAt: g.last_refreshed_at ? new Date(g.last_refreshed_at) : undefined,
                createdAt: new Date(g.created_at)
            }));

            set({ goals: formattedGoals });
            // Don't await this to speed up UI, let it run in background
            get().checkAndRefreshGoals();
        }
        set({ loading: false });
    },

    addGoal: async (goal) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Map camelCase to snake_case for DB
        const dbGoal: any = {
            user_id: user.id,
            name: goal.name,
            target_amount: goal.targetAmount,
            current_amount: goal.currentAmount,
            account_id: goal.accountId,
            tracking_type: goal.trackingType,
            refresh_type: goal.refreshType,
            monthly_plan: goal.monthlyPlan,
            priority: goal.priority,
            deadline: goal.deadline,
            status: goal.status,
        };

        // Only add last_refreshed_at if it's defined in the schema to avoid PGRST204
        if (goal.lastRefreshedAt) {
            dbGoal.last_refreshed_at = goal.lastRefreshedAt;
        } else if (goal.refreshType === 'monthly') {
            dbGoal.last_refreshed_at = new Date();
        }

        const { error } = await supabase
            .from('goals')
            .insert(dbGoal);

        if (error) {
            console.error('Error adding goal:', error);
            toast.error('Failed to add goal');
        } else {
            await get().fetchGoals();
        }
    },

    updateGoal: async (id, updates) => {
        // Map camelCase updates to snake_case
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
        if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
        if (updates.accountId !== undefined) dbUpdates.account_id = updates.accountId;
        if (updates.trackingType !== undefined) dbUpdates.tracking_type = updates.trackingType;
        if (updates.refreshType !== undefined) dbUpdates.refresh_type = updates.refreshType;
        if (updates.monthlyPlan !== undefined) dbUpdates.monthly_plan = updates.monthlyPlan;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.lastRefreshedAt !== undefined) dbUpdates.last_refreshed_at = updates.lastRefreshedAt;

        const { error } = await supabase
            .from('goals')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating goal:', error);
            toast.error('Failed to update goal');
        } else {
            await get().fetchGoals();
        }
    },

    deleteGoal: async (id) => {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting goal:', error);
            toast.error('Failed to delete goal');
        } else {
            await get().fetchGoals();
        }
    },

    checkAndRefreshGoals: async () => {
        const { goals } = get();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        for (const goal of goals) {
            if (goal.refreshType === 'monthly' && goal.id) {
                const lastRefreshed = goal.lastRefreshedAt ? new Date(goal.lastRefreshedAt) : new Date(0);

                if (lastRefreshed.getMonth() !== currentMonth || lastRefreshed.getFullYear() !== currentYear) {
                    await supabase
                        .from('goals')
                        .update({
                            current_amount: 0,
                            last_refreshed_at: now.toISOString()
                        })
                        .eq('id', goal.id);

                    console.log(`Refreshed goal: ${goal.name}`);
                }
            }
        }
    },
}));
