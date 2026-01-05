import { create } from 'zustand';
import { db } from '../lib/db';
import type { Category } from '../lib/db';

interface CategoryStore {
    categories: Category[];
    loading: boolean;
    fetchCategories: () => Promise<void>;
    addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
    updateCategory: (id: number, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: number) => Promise<void>;
    getCategoriesByType: (type: 'income' | 'expense') => Category[];
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
    categories: [],
    loading: false,

    fetchCategories: async () => {
        set({ loading: true });
        const categories = await db.categories.toArray();
        set({ categories, loading: false });
    },

    addCategory: async (category) => {
        await db.categories.add(category);
        await get().fetchCategories();
    },

    updateCategory: async (id, updates) => {
        await db.categories.update(id, updates);
        await get().fetchCategories();
    },

    deleteCategory: async (id) => {
        await db.categories.delete(id);
        await get().fetchCategories();
    },

    getCategoriesByType: (type) => {
        return get().categories.filter(c => c.type === type);
    },
}));
