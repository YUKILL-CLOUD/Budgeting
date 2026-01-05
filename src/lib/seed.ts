import { db } from './db';
import type { Category } from './db';

// Default categories to seed the database
export const defaultCategories: Omit<Category, 'id'>[] = [
    // Income Categories
    { name: 'Salary', icon: 'Briefcase', color: '#10b981', type: 'income' },
    { name: 'Freelance', icon: 'Code', color: '#3b82f6', type: 'income' },
    { name: 'Gifts', icon: 'Gift', color: '#ec4899', type: 'income' },
    { name: 'Investments', icon: 'TrendingUp', color: '#8b5cf6', type: 'income' },
    { name: 'Other Income', icon: 'DollarSign', color: '#6b7280', type: 'income' },

    // Expense Categories
    { name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#ef4444', type: 'expense' },
    { name: 'Transportation', icon: 'Car', color: '#f59e0b', type: 'expense' },
    { name: 'Housing', icon: 'Home', color: '#8b5cf6', type: 'expense' },
    { name: 'Bills & Utilities', icon: 'Receipt', color: '#06b6d4', type: 'expense' },
    { name: 'Entertainment', icon: 'Gamepad2', color: '#ec4899', type: 'expense' },
    { name: 'Shopping', icon: 'ShoppingBag', color: '#f97316', type: 'expense' },
    { name: 'Health', icon: 'Heart', color: '#ef4444', type: 'expense' },
    { name: 'Travel', icon: 'Plane', color: '#3b82f6', type: 'expense' },
    { name: 'Education', icon: 'GraduationCap', color: '#8b5cf6', type: 'expense' },
    { name: 'Personal Care', icon: 'Sparkles', color: '#ec4899', type: 'expense' },
    { name: 'Other Expenses', icon: 'MoreHorizontal', color: '#6b7280', type: 'expense' },
];

export async function seedDatabase() {
    const accounts = await db.accounts.toArray();

    // 1. Cleanup Duplicates (if they already exist in user's DB)
    const allCategories = await db.categories.toArray();
    const seenCat = new Set<string>();
    const catToDelete: number[] = [];

    for (const cat of allCategories) {
        const key = `${cat.type}-${cat.name.trim().toLowerCase()}`;
        if (seenCat.has(key)) {
            if (cat.id) catToDelete.push(cat.id);
        } else {
            seenCat.add(key);
        }
    }

    if (catToDelete.length > 0) {
        await db.categories.bulkDelete(catToDelete);
        console.log(`Cleaned up ${catToDelete.length} duplicate categories`);
    }

    // accounts cleanup
    const seenAcc = new Set<string>();
    const accToDelete: number[] = [];
    for (const acc of accounts) {
        const key = acc.name.trim().toLowerCase();
        if (seenAcc.has(key)) {
            if (acc.id) accToDelete.push(acc.id);
        } else {
            seenAcc.add(key);
        }
    }

    if (accToDelete.length > 0) {
        await db.accounts.bulkDelete(accToDelete);
        console.log(`Cleaned up ${accToDelete.length} duplicate accounts`);
    }

    // 2. Initial Seed (only if truly empty)
    const finalCatCount = await db.categories.count();
    const finalAccCount = await db.accounts.count();

    if (finalCatCount === 0) {
        console.log('Seeding initial categories...');
        await db.categories.bulkAdd(defaultCategories);
    }

    if (finalAccCount === 0) {
        console.log('Seeding initial accounts...');
        await db.accounts.bulkAdd([
            {
                name: 'GoTyme',
                type: 'bank',
                balance: 0,
                color: '#00bfa5',
                icon: 'Building2',
                createdAt: new Date(),
            },
            {
                name: 'BPI',
                type: 'bank',
                balance: 0,
                color: '#ce1126',
                icon: 'Building2',
                createdAt: new Date(),
            },
            {
                name: 'Savings',
                type: 'savings',
                balance: 0,
                color: '#f59e0b',
                icon: 'PiggyBank',
                createdAt: new Date(),
            },
            {
                name: 'Cash',
                type: 'cash',
                balance: 0,
                color: '#10b981',
                icon: 'Wallet',
                createdAt: new Date(),
            },
        ]);
    }

    console.log('Database seeded successfully!');
}
