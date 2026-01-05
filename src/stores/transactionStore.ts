import { create } from 'zustand';
import { db } from '../lib/db';
import type { Transaction } from '../lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useAccountStore } from './accountStore';

interface TransactionStore {
    transactions: Transaction[];
    loading: boolean;
    fetchTransactions: (startDate?: Date, endDate?: Date) => Promise<void>;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
    updateTransaction: (id: number, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: number) => Promise<void>;
    getMonthlyIncome: (date?: Date) => Promise<number>;
    getMonthlyExpenses: (date?: Date) => Promise<number>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
    transactions: [],
    loading: false,

    fetchTransactions: async (startDate, endDate) => {
        set({ loading: true });
        let query = db.transactions.orderBy('date').reverse();

        if (startDate && endDate) {
            query = query.filter(t => t.date >= startDate && t.date <= endDate);
        }

        const transactions = await query.toArray();
        set({ transactions, loading: false });
    },

    addTransaction: async (transaction) => {
        await db.transactions.add({
            ...transaction,
            createdAt: new Date(),
        });

        // Update account balance
        const account = await db.accounts.get(transaction.accountId);
        if (account) {
            const balanceChange = transaction.type === 'income'
                ? transaction.amount
                : -transaction.amount;

            await db.accounts.update(transaction.accountId, {
                balance: account.balance + balanceChange,
            });
        }

        // If transfer, update destination account
        if (transaction.type === 'transfer' && transaction.transferToAccountId) {
            const toAccount = await db.accounts.get(transaction.transferToAccountId);
            if (toAccount) {
                await db.accounts.update(transaction.transferToAccountId, {
                    balance: toAccount.balance + transaction.amount,
                });
            }
        }

        await get().fetchTransactions();
        // Sync account store
        await useAccountStore.getState().fetchAccounts();
    },

    updateTransaction: async (id, updates) => {
        const oldTransaction = await db.transactions.get(id);
        if (!oldTransaction) return;

        // 1. Reverse old balance effect
        const oldAccount = await db.accounts.get(oldTransaction.accountId);
        if (oldAccount) {
            const reversal = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
            await db.accounts.update(oldTransaction.accountId, { balance: oldAccount.balance + reversal });
        }

        // If it was a transfer, reverse the destination too
        if (oldTransaction.type === 'transfer' && oldTransaction.transferToAccountId) {
            const oldToAccount = await db.accounts.get(oldTransaction.transferToAccountId);
            if (oldToAccount) {
                await db.accounts.update(oldTransaction.transferToAccountId, { balance: oldToAccount.balance - oldTransaction.amount });
            }
        }

        // 2. Perform the update in DB
        await db.transactions.update(id, updates);
        const newTransaction = await db.transactions.get(id);
        if (!newTransaction) return;

        // 3. Apply new balance effect
        const newAccount = await db.accounts.get(newTransaction.accountId);
        if (newAccount) {
            const application = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
            await db.accounts.update(newTransaction.accountId, { balance: newAccount.balance + application });
        }

        if (newTransaction.type === 'transfer' && newTransaction.transferToAccountId) {
            const newToAccount = await db.accounts.get(newTransaction.transferToAccountId);
            if (newToAccount) {
                await db.accounts.update(newTransaction.transferToAccountId, { balance: newToAccount.balance + newTransaction.amount });
            }
        }

        await get().fetchTransactions();
        await useAccountStore.getState().fetchAccounts();
    },

    deleteTransaction: async (id) => {
        const transaction = await db.transactions.get(id);
        if (transaction) {
            // Reverse the balance change
            const account = await db.accounts.get(transaction.accountId);
            if (account) {
                const balanceChange = transaction.type === 'income'
                    ? -transaction.amount
                    : transaction.amount;

                await db.accounts.update(transaction.accountId, {
                    balance: account.balance + balanceChange,
                });
            }
        }

        await db.transactions.delete(id);
        await get().fetchTransactions();
        await useAccountStore.getState().fetchAccounts();
    },

    getMonthlyIncome: async (date = new Date()) => {
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const transactions = await db.transactions
            .where('date')
            .between(start, end)
            .and(t => t.type === 'income')
            .toArray();

        return transactions.reduce((sum, t) => sum + t.amount, 0);
    },

    getMonthlyExpenses: async (date = new Date()) => {
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const transactions = await db.transactions
            .where('date')
            .between(start, end)
            .and(t => t.type === 'expense')
            .toArray();

        return transactions.reduce((sum, t) => sum + t.amount, 0);
    },
}));
