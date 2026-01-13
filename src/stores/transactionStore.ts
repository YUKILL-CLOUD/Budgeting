import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useAccountStore } from './accountStore';
import { toast } from 'sonner';

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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            set({ transactions: [], loading: false });
            return;
        }

        let query = supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });

        if (startDate && endDate) {
            query = query
                .gte('date', startDate.toISOString())
                .lte('date', endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Failed to sync transactions');
        } else {
            // Convert snake_case from Supabase back to camelCase for App
            const formatted = data.map((t: any) => ({
                id: t.id,
                accountId: t.account_id,
                amount: t.amount,
                type: t.type,
                categoryId: t.category_id,
                transferToAccountId: t.transfer_to_account_id,
                date: new Date(t.date),
                note: t.note,
                createdAt: new Date(t.created_at)
            }));
            set({ transactions: formatted as Transaction[] });
        }
        set({ loading: false });
    },

    addTransaction: async (transaction) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Insert Transaction (Map to snake_case for Supabase)
        const { error } = await supabase
            .from('transactions')
            .insert({
                type: transaction.type,
                amount: transaction.amount,
                account_id: transaction.accountId,
                category_id: transaction.categoryId,
                transfer_to_account_id: transaction.transferToAccountId,
                note: transaction.note,
                date: transaction.date,
                user_id: user.id
            });

        if (error) {
            console.error('Error adding transaction:', error);
            toast.error('Failed to add transaction');
            return;
        }

        // 2. Update Account Balance
        const { data: account } = await supabase
            .from('accounts')
            .select('balance')
            .eq('id', transaction.accountId)
            .single();

        if (account) {
            const balanceChange = transaction.type === 'income'
                ? Number(transaction.amount)
                : -Number(transaction.amount);

            await supabase
                .from('accounts')
                .update({ balance: Number(account.balance) + balanceChange })
                .eq('id', transaction.accountId);
        }

        // 3. Handle Transfer Destination
        if (transaction.type === 'transfer' && transaction.transferToAccountId) {
            const { data: toAccount } = await supabase
                .from('accounts')
                .select('balance')
                .eq('id', transaction.transferToAccountId)
                .single();

            if (toAccount) {
                await supabase
                    .from('accounts')
                    .update({ balance: Number(toAccount.balance) + Number(transaction.amount) })
                    .eq('id', transaction.transferToAccountId);
            }
        }

        await get().fetchTransactions();
        await useAccountStore.getState().fetchAccounts();
    },

    updateTransaction: async (id, updates) => {
        // 1. Get Old Transaction to reverse balance effect
        const { data: oldTransaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .single();

        if (!oldTransaction) return;

        // Reverse Old Balance
        const { data: oldAccount } = await supabase.from('accounts').select('balance').eq('id', oldTransaction.account_id).single();
        if (oldAccount) {
            const reversal = oldTransaction.type === 'income' ? -Number(oldTransaction.amount) : Number(oldTransaction.amount);
            await supabase.from('accounts').update({ balance: Number(oldAccount.balance) + reversal }).eq('id', oldTransaction.account_id);
        }

        // Reverse Transfer Destination if needed
        if (oldTransaction.type === 'transfer' && oldTransaction.transfer_to_account_id) {
            const { data: oldToAccount } = await supabase.from('accounts').select('balance').eq('id', oldTransaction.transfer_to_account_id).single();
            if (oldToAccount) {
                await supabase.from('accounts').update({ balance: Number(oldToAccount.balance) - Number(oldTransaction.amount) }).eq('id', oldTransaction.transfer_to_account_id);
            }
        }

        // 2. Update Transaction
        const { error } = await supabase.from('transactions').update(updates).eq('id', id);
        if (error) {
            toast.error("Failed to update transaction");
            return;
        }

        // 3. Apply New Balance Effect
        // We re-fetch the transaction to be sure we have the full new state (incase updates was partial)
        const { data: newTransaction } = await supabase.from('transactions').select('*').eq('id', id).single();
        if (!newTransaction) return;

        const { data: newAccount } = await supabase.from('accounts').select('balance').eq('id', newTransaction.account_id).single();
        if (newAccount) {
            const application = newTransaction.type === 'income' ? Number(newTransaction.amount) : -Number(newTransaction.amount);
            await supabase.from('accounts').update({ balance: Number(newAccount.balance) + application }).eq('id', newTransaction.account_id);
        }

        if (newTransaction.type === 'transfer' && newTransaction.transfer_to_account_id) {
            const { data: newToAccount } = await supabase.from('accounts').select('balance').eq('id', newTransaction.transfer_to_account_id).single();
            if (newToAccount) {
                await supabase.from('accounts').update({ balance: Number(newToAccount.balance) + Number(newTransaction.amount) }).eq('id', newTransaction.transfer_to_account_id);
            }
        }

        await get().fetchTransactions();
        await useAccountStore.getState().fetchAccounts();
    },

    deleteTransaction: async (id) => {
        const { data: transaction } = await supabase.from('transactions').select('*').eq('id', id).single();

        if (transaction) {
            // Reverse balance change
            const { data: account } = await supabase.from('accounts').select('balance').eq('id', transaction.account_id).single();
            if (account) {
                const balanceChange = transaction.type === 'income'
                    ? -Number(transaction.amount)
                    : Number(transaction.amount);

                await supabase.from('accounts').update({ balance: Number(account.balance) + balanceChange }).eq('id', transaction.account_id);
            }

            // Reverse transfer dest
            if (transaction.type === 'transfer' && transaction.transfer_to_account_id) {
                const { data: toAccount } = await supabase.from('accounts').select('balance').eq('id', transaction.transfer_to_account_id).single();
                if (toAccount) {
                    await supabase.from('accounts').update({ balance: Number(toAccount.balance) - Number(transaction.amount) }).eq('id', transaction.transfer_to_account_id);
                }
            }
        }

        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) {
            toast.error("Failed to delete transaction");
        } else {
            await get().fetchTransactions();
            await useAccountStore.getState().fetchAccounts();
        }
    },

    getMonthlyIncome: async (date = new Date()) => {
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();

        const { data } = await supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'income')
            .gte('date', start)
            .lte('date', end);

        if (!data) return 0;
        return data.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    },

    getMonthlyExpenses: async (date = new Date()) => {
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();

        const { data } = await supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'expense')
            .gte('date', start)
            .lte('date', end);

        if (!data) return 0;
        return data.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    },
}));
