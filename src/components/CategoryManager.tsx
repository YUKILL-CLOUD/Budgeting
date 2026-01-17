import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Tag, Check } from 'lucide-react';
import { useCategoryStore } from '../stores/categoryStore';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CategoryManagerProps {
    onClose: () => void;
    isOpen: boolean;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose, isOpen }) => {
    const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [icon, setIcon] = useState('Tag');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const filteredCategories = categories.filter(c => c.type === activeTab);

    const colors = [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#475569',
        '#d946ef', '#f97316', '#22c55e', '#3b82f6'
    ];

    const resetForm = () => {
        setName('');
        setColor('#6366f1');
        setIcon('Tag');
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setIsSaving(true);
            if (editingId) {
                await updateCategory(editingId, { name, color, icon });
                toast.success('Category updated');
            } else {
                await addCategory({
                    name,
                    type: activeTab,
                    color,
                    icon,
                });
                toast.success('Category added');
            }
            resetForm();
        } catch (err) {
            toast.error('Failed to save category');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (cat: any) => {
        setEditingId(cat.id);
        setName(cat.name);
        setColor(cat.color);
        setIcon(cat.icon);
        setIsAdding(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure? Transactions in this category will become uncategorized.')) {
            await deleteCategory(id);
            toast.success('Category deleted');
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#1e293b] border-white/10 text-white flex flex-col max-h-[85vh]">
                <DialogHeader className="flex-none">
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="text-indigo-500" size={20} />
                        Manage Categories
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Organize your spending & income types
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-none flex items-center bg-slate-800/50 p-1 rounded-lg border border-white/5 mb-2">
                    <button
                        className={cn(
                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === 'expense' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                        onClick={() => { setActiveTab('expense'); resetForm(); }}
                    >
                        Expenses
                    </button>
                    <button
                        className={cn(
                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === 'income' ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                        onClick={() => { setActiveTab('income'); resetForm(); }}
                    >
                        Income
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                    {isAdding ? (
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="categoryName" className="text-slate-300">Category Name</Label>
                                <Input
                                    id="categoryName"
                                    type="text"
                                    className="bg-slate-800 border-white/10 text-white"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Groceries"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Color Tag</Label>
                                <div className="grid grid-cols-6 gap-2">
                                    {colors.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border border-white/10",
                                                color === c ? "scale-110 ring-2 ring-white" : "hover:scale-110 opacity-80 hover:opacity-100"
                                            )}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setColor(c)}
                                        >
                                            {color === c && <Check size={14} className="text-white drop-shadow-md" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={resetForm} className="text-slate-400 hover:text-white hover:bg-white/10">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className={cn(
                                        "text-white min-w-[120px]",
                                        activeTab === 'expense' ? "bg-indigo-500 hover:bg-indigo-600" : "bg-emerald-500 hover:bg-emerald-600"
                                    )}
                                >
                                    {isSaving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <Button
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-white/10 border-dashed py-6"
                                onClick={() => setIsAdding(true)}
                            >
                                <Plus size={18} className="mr-2" />
                                Add New {activeTab === 'expense' ? 'Expense' : 'Income'} Category
                            </Button>

                            <div className="space-y-2">
                                {filteredCategories.map(cat => (
                                    <div key={cat.id} className="group flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-white/5 hover:bg-slate-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full shadow-sm"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="font-medium text-slate-200">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10" onClick={() => handleEdit(cat)}>
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10"
                                                onClick={() => cat.id && handleDelete(cat.id)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {filteredCategories.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 italic text-sm">
                                        No categories found. Create one to get started!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
