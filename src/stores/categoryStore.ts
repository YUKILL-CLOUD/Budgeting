import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Category } from '../lib/db';
import { defaultCategories } from '../lib/seed';
import { toast } from 'sonner';

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            set({ categories: [], loading: false });
            return;
        }

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to sync categories');
            set({ loading: false });
        } else {
            if (data && data.length === 0) {
                // Auto-seed samples if empty
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const seedData = defaultCategories.map(c => ({ ...c, user_id: user.id }));
                    await supabase.from('categories').insert(seedData);
                    // Re-fetch after seeding
                    const { data: seeded } = await supabase.from('categories').select('*').order('name', { ascending: true });
                    set({ categories: seeded as Category[], loading: false });
                } else {
                    set({ categories: [], loading: false });
                }
            } else {
                set({ categories: data as Category[], loading: false });
            }
        }
    },

    addCategory: async (category) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('categories')
            .insert({
                ...category,
                user_id: user.id
            });

        if (error) {
            console.error('Error adding category:', error);
            toast.error('Failed to add category');
        } else {
            await get().fetchCategories();
        }
    },

    updateCategory: async (id, updates) => {
        const { error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating category:', error);
            toast.error('Failed to update category');
        } else {
            await get().fetchCategories();
        }
    },

    deleteCategory: async (id) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        } else {
            await get().fetchCategories();
        }
    },

    getCategoriesByType: (type) => {
        return get().categories.filter(c => c.type === type);
    },
}));
