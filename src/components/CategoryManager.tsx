import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Tag, Check } from 'lucide-react';
import { useCategoryStore } from '../stores/categoryStore';
import { toast } from 'sonner';

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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content category-manager-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-title-group">
                        <Tag className="accent-icon" size={24} />
                        <div>
                            <h2>Manage Categories</h2>
                            <p className="subtitle">Organize your spending & income</p>
                        </div>
                    </div>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="category-tabs">
                    <button
                        className={`cat-tab ${activeTab === 'expense' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('expense'); resetForm(); }}
                    >
                        Expenses
                    </button>
                    <button
                        className={`cat-tab ${activeTab === 'income' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('income'); resetForm(); }}
                    >
                        Income
                    </button>
                </div>

                {isAdding ? (
                    <form onSubmit={handleSubmit} className="category-form">
                        <div className="form-group">
                            <label>Category Name</label>
                            <input
                                type="text"
                                className="styled-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Groceries"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Color</label>
                            <div className="color-grid">
                                {colors.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`color-swatch ${color === c ? 'active' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setColor(c)}
                                    >
                                        {color === c && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn-modal-cancel" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-modal-submit">
                                {editingId ? 'Update Category' : 'Create Category'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="category-list-container">
                        <button className="btn-add-category" onClick={() => setIsAdding(true)}>
                            <Plus size={18} />
                            <span>Add New {activeTab === 'expense' ? 'Expense' : 'Income'} Category</span>
                        </button>

                        <div className="category-list">
                            {filteredCategories.map(cat => (
                                <div key={cat.id} className="category-item-row">
                                    <div className="cat-info">
                                        <div
                                            className="cat-dot"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="cat-name">{cat.name}</span>
                                    </div>
                                    <div className="cat-actions">
                                        <button className="btn-cat-action" onClick={() => handleEdit(cat)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn-cat-action delete"
                                            onClick={() => cat.id && handleDelete(cat.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
