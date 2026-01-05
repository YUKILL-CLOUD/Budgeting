import Dexie from 'dexie';
import type { Table } from 'dexie';

// Type definitions
export interface Account {
    id?: number;
    name: string;
    type: 'bank' | 'cash' | 'credit' | 'savings';
    balance: number;
    color: string;
    icon: string;
    createdAt: Date;
}

export interface Transaction {
    id?: number;
    accountId: number;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    categoryId?: number;
    date: Date;
    note?: string;
    receipt?: string; // base64 image
    transferToAccountId?: number; // for transfers
    createdAt: Date;
}

export interface Category {
    id?: number;
    name: string;
    icon: string;
    color: string;
    type: 'income' | 'expense';
    parentId?: number; // for subcategories
}

export interface Budget {
    id?: number;
    categoryId: number;
    amount: number;
    period: 'weekly' | 'monthly';
    startDate: Date;
}

export interface RecurringTransaction {
    id?: number;
    accountId: number;
    amount: number;
    type: 'income' | 'expense';
    categoryId: number;
    description: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    nextDate: Date;
    isActive: boolean;
}

export interface Goal {
    id?: number;
    name: string;
    targetAmount: number;
    currentAmount: number;
    accountId?: number; // Linked account reference
    trackingType: 'auto' | 'manual'; // 'auto' uses full account balance, 'manual' is user allocated
    refreshType: 'none' | 'monthly'; // 'monthly' resets the currentAmount to 0 each month
    monthlyPlan: number; // Planned contribution for the monthly blueprint
    priority: 'high' | 'medium' | 'low'; // Priority for smart allocation
    lastRefreshedAt?: Date;
    deadline: Date;
    status: 'active' | 'paused' | 'reached';
    createdAt: Date;
}

// Database class
export class BudgetDatabase extends Dexie {
    accounts!: Table<Account>;
    transactions!: Table<Transaction>;
    categories!: Table<Category>;
    budgets!: Table<Budget>;
    recurringTransactions!: Table<RecurringTransaction>;
    goals!: Table<Goal>;

    constructor() {
        super('BudgetDatabase');

        this.version(1).stores({
            accounts: '++id, name, type, balance',
            transactions: '++id, accountId, type, categoryId, date, createdAt',
            categories: '++id, name, type, parentId',
            budgets: '++id, categoryId, period, startDate',
            recurringTransactions: '++id, accountId, categoryId, nextDate, isActive',
            goals: '++id, status, deadline'
        });
    }
}

export const db = new BudgetDatabase();
