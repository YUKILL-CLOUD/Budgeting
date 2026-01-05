import { create } from 'zustand';
import { db } from '../lib/db';
import type { Account } from '../lib/db';

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
        const accounts = await db.accounts.toArray();
        set({ accounts, loading: false });
    },

    addAccount: async (account) => {
        await db.accounts.add({
            ...account,
            createdAt: new Date(),
        });
        await get().fetchAccounts();
    },

    updateAccount: async (id, updates) => {
        await db.accounts.update(id, updates);
        await get().fetchAccounts();
    },

    deleteAccount: async (id) => {
        await db.accounts.delete(id);
        await get().fetchAccounts();
    },

    getTotalBalance: () => {
        return get().accounts.reduce((sum, acc) => sum + acc.balance, 0);
    },
}));
