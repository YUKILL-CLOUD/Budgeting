import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Trophy, Check, Edit2, Receipt } from 'lucide-react';
import { useGoalStore } from '../stores/goalStore';
import { useAccountStore } from '../stores/accountStore';
import { toast } from 'sonner';

export const BudgetForm: React.FC = () => {
    const { goals, addGoal, updateGoal, deleteGoal, fetchGoals } = useGoalStore();
    const { accounts } = useAccountStore();

    // Goal Form State
    const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [monthlyPlan, setMonthlyPlan] = useState('');
    const [accountId, setAccountId] = useState<string>('');
    const [trackingType, setTrackingType] = useState<'auto' | 'manual'>('manual');
    const [refreshType, setRefreshType] = useState<'none' | 'monthly'>('none');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

    // Bill Form Specifics (UI helpers to convert to Goal)
    const [billFreq, setBillFreq] = useState<'Weekly' | 'Monthly'>('Monthly');

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    // Split Goals into Categories
    const savingsGoals = goals.filter(g => g.refreshType !== 'monthly');
    const obligations = goals.filter(g => g.refreshType === 'monthly');

    const resetForm = () => {
        setEditingGoalId(null);
        setName('');
        setTargetAmount('');
        setMonthlyPlan('');
        setAccountId('');
        setTrackingType('manual');
        setRefreshType('none');
        setPriority('medium');
        setBillFreq('Monthly');
    };

    const handleSaveGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        // Auto-calculate monthly plan for bills if weekly freq selected (UI helper)
        let finalMonthlyPlan = parseFloat(monthlyPlan) || 0;
        if (refreshType === 'monthly' && billFreq === 'Weekly') {
            finalMonthlyPlan = finalMonthlyPlan * 4.33;
        }

        const payload = {
            name,
            targetAmount: parseFloat(targetAmount) || 0,
            monthlyPlan: finalMonthlyPlan,
            accountId: accountId ? parseInt(accountId) : undefined,
            trackingType,
            refreshType,
            priority,
            currentAmount: editingGoalId ? undefined : 0, // Don't reset current if editing
            status: 'active' as const,
            deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Default 1 year
        };

        try {
            if (editingGoalId) {
                // @ts-ignore - Supabase might expect partial update but explicit type might clash
                await updateGoal(editingGoalId, payload);
                toast.success('Updated successfully');
            } else {
                await addGoal({ ...payload, currentAmount: 0 });
                toast.success('Added successfully');
            }
            resetForm();
        } catch (err) {
            toast.error('Failed to save');
        }
    };

    const handleEdit = (goal: any) => {
        setEditingGoalId(goal.id);
        setName(goal.name);
        setTargetAmount(goal.targetAmount.toString());
        setMonthlyPlan(goal.monthlyPlan?.toString() || '');
        setAccountId(goal.accountId?.toString() || '');
        setTrackingType(goal.trackingType);
        setRefreshType(goal.refreshType);
        setPriority(goal.priority);
    };

    return (
        <div className="goals-container">
            <div className="tab-page-header">
                <div className="header-with-icon">
                    <div className="header-icon-pill">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <h2 className="page-title">Goals & Planning</h2>
                        <p className="page-subtitle">Set your savings targets and recurring obligations</p>
                    </div>
                </div>
            </div>

            <div className="budget-form-container">
                {/* SAVINGS SECTION */}
                <section className="card card-savings">
                    <div className="card-header border-gold">
                        <div className="header-title-group">
                            <Trophy style={{ color: '#fbbf24' }} size={24} />
                            <div>
                                <h2>Savings Targets</h2>
                                <p className="subtitle">Long-term goals & Wishlist</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveGoal} className="goal-blueprint-form">
                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label className="field-label">Goal Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Laptop" required />
                            </div>
                            <div className="form-group">
                                <label className="field-label">Target Amount</label>
                                <div className="input-wrapper">
                                    <span className="currency-prefix">₱</span>
                                    <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0.00" required />
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="field-label">Monthly Savings Plan</label>
                                <div className="input-wrapper">
                                    <span className="currency-prefix">₱</span>
                                    <input type="number" value={monthlyPlan} onChange={e => setMonthlyPlan(e.target.value)} placeholder="Amount to save/mo" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="field-label">Linked Account</label>
                                <select value={accountId} onChange={e => setAccountId(e.target.value)} className="styled-select-gold">
                                    <option value="">None</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </div>
                        {/* Hidden details for savings */}
                        <input type="hidden" value={refreshType} />

                        <div className="form-footer">
                            <button type="submit" className="btn-blueprint-submit" onClick={() => setRefreshType('none')}>
                                {editingGoalId ? <Check size={18} /> : <Plus size={18} />}
                                <span>{editingGoalId ? 'Update Savings Goal' : 'Add Savings Goal'}</span>
                            </button>
                            {editingGoalId && <button type="button" onClick={resetForm} className="btn-text-sm danger">Cancel</button>}
                        </div>
                    </form>

                    <div className="goals-planner-list">
                        {savingsGoals.map(goal => (
                            <div key={goal.id} className="goal-planner-item">
                                <div className="goal-main-info">
                                    <span className="goal-name">{goal.name}</span>
                                    <div className="goal-meta-row">
                                        <span className="goal-target">🎯 ₱ {goal.targetAmount.toLocaleString()}</span>
                                        <span className="goal-monthly-plan">📅 ₱ {(goal.monthlyPlan || 0).toLocaleString()}/mo</span>
                                    </div>
                                </div>
                                <div className="goal-actions">
                                    <button className="btn-icon-sm" onClick={() => handleEdit(goal)}><Edit2 size={16} /></button>
                                    <button className="btn-icon-sm" onClick={() => goal.id && deleteGoal(goal.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* BILLS SECTION */}
                <section className="card card-expenses">
                    <div className="card-header border-pink">
                        <div className="header-title-group">
                            <Receipt className="text-pink" size={24} />
                            <div>
                                <h2>Monthly Obligations</h2>
                                <p className="subtitle">Recurring bills & Fixed costs</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveGoal} className="add-expense-blueprint">
                        <div className="form-grid-blueprint">
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Bill Name (e.g. Rent)" required />
                            <div className="input-wrapper">
                                <span className="currency-prefix">₱</span>
                                <input type="number" value={monthlyPlan} onChange={e => setMonthlyPlan(e.target.value)} placeholder="Amount" required />
                            </div>
                            <select value={billFreq} onChange={e => setBillFreq(e.target.value as any)}>
                                <option value="Monthly">Monthly</option>
                                <option value="Weekly">Weekly</option>
                            </select>
                        </div>
                        <div className="form-meta-blueprint">
                            <div className="prio-select">
                                <label>Priority:</label>
                                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="mini-select">
                                    <option value="high">High (Must Pay)</option>
                                    <option value="medium">Medium</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-add-blueprint" onClick={() => { setRefreshType('monthly'); setTargetAmount('0'); }}>
                                <Plus size={16} /> Add to Plan
                            </button>
                        </div>
                    </form>

                    <div className="blueprint-list">
                        {obligations.map(goal => (
                            <div key={goal.id} className="blueprint-item">
                                <div className="item-details">
                                    <span className="item-title">{goal.name}</span>
                                    <span className="item-meta">Monthly Plan • {goal.priority}</span>
                                </div>
                                <div className="item-amount">
                                    ₱ {(goal.monthlyPlan || 0).toLocaleString()}
                                    <div className="item-actions">
                                        <button className="btn-icon-action edit-sm" onClick={() => handleEdit(goal)}><Edit2 size={14} /></button>
                                        <button className="btn-icon-action delete-sm" onClick={() => goal.id && deleteGoal(goal.id)}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
