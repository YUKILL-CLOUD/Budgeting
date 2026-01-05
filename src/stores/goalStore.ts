import { create } from 'zustand';
import { db } from '../lib/db';
import type { Goal } from '../lib/db';

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
        const goals = await db.goals.toArray();
        set({ goals, loading: false });
        await get().checkAndRefreshGoals(); // Check for resets whenever we fetch
    },

    addGoal: async (goal) => {
        await db.goals.add({
            ...goal,
            createdAt: new Date(),
            lastRefreshedAt: new Date(),
        } as Goal);
        await get().fetchGoals();
    },

    updateGoal: async (id, updates) => {
        await db.goals.update(id, updates);
        await get().fetchGoals();
    },

    deleteGoal: async (id) => {
        await db.goals.delete(id);
        await get().fetchGoals();
    },

    checkAndRefreshGoals: async () => {
        const { goals } = get();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        for (const goal of goals) {
            if (goal.refreshType === 'monthly' && goal.id) {
                const lastRefreshed = goal.lastRefreshedAt ? new Date(goal.lastRefreshedAt) : new Date(0);

                // If the last refresh was in a previous month OR year
                if (lastRefreshed.getMonth() !== currentMonth || lastRefreshed.getFullYear() !== currentYear) {
                    await db.goals.update(goal.id, {
                        currentAmount: 0,
                        lastRefreshedAt: now
                    });
                    console.log(`Refreshed goal: ${goal.name}`);
                }
            }
        }
    },
}));
