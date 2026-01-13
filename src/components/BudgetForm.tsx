import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Trophy, Check, Edit2, Receipt, MoreVertical, DollarSign } from 'lucide-react';
import { useGoalStore } from '../stores/goalStore';
import { useAccountStore } from '../stores/accountStore';
import { useObligationStore } from '../stores/obligationStore';
import { ContributeModal } from './ContributeModal';
import { toast } from 'sonner';

export const BudgetForm: React.FC = () => {
    const { goals, addGoal, updateGoal, deleteGoal, fetchGoals, fundGoal } = useGoalStore();
    const { obligations, addObligation, updateObligation, deleteObligation, fetchObligations } = useObligationStore();
    const { accounts } = useAccountStore();

    // Goal Funding Modal State
    const [fundingGoal, setFundingGoal] = useState<any | null>(null);

    // Goal Form State
    const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
    const [editingObligationId, setEditingObligationId] = useState<number | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [isSavingGoal, setIsSavingGoal] = useState(false);
    const [isSavingObligation, setIsSavingObligation] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [monthlyPlan, setMonthlyPlan] = useState('');
    const [accountId, setAccountId] = useState<string>('');
    const [refreshType, setRefreshType] = useState<'none' | 'monthly'>('none');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [currentAmount, setCurrentAmount] = useState('');
    const [deadline, setDeadline] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);
    // Bill Form Specifics (UI helpers to convert to Goal)
    const [billFreq, setBillFreq] = useState<'Weekly' | 'Monthly'>('Monthly');

    useEffect(() => {
        fetchGoals();
        fetchObligations();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [fetchGoals, fetchObligations]);

    // Savings Goals are goals that DON'T have a monthly reset (handled by separate store now)
    const savingsGoals = goals;
    const monthlyObligations = obligations;

    const resetForm = () => {
        setEditingGoalId(null);
        setEditingObligationId(null);
        setName('');
        setTargetAmount('');
        setMonthlyPlan('');
        setAccountId('');
        setRefreshType('none');
        setPriority('medium');
        setCurrentAmount('');
        setDeadline(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);
        setBillFreq('Monthly');
    };

    const handleSaveGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        const payload = {
            name,
            targetAmount: parseFloat(targetAmount) || 0,
            monthlyPlan: parseFloat(monthlyPlan) || 0,
            accountId: accountId ? parseInt(accountId) : undefined,
            trackingType: 'manual' as const,
            refreshType: 'none' as const,
            priority,
            currentAmount: editingGoalId ? undefined : (parseFloat(currentAmount) || 0),
            status: 'active' as const,
            deadline: new Date(deadline)
        };

        try {
            setIsSavingGoal(true);
            if (editingGoalId) {
                // @ts-ignore
                await updateGoal(editingGoalId, payload);
                toast.success('Goal updated successfully');
            } else {
                await addGoal({ ...payload, currentAmount: parseFloat(currentAmount) || 0 });
                toast.success('Goal added successfully');
            }
            resetForm();
        } catch (err) {
            toast.error('Failed to save goal');
        } finally {
            setIsSavingGoal(false);
        }
    };

    const handleSaveObligation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        let finalAmount = parseFloat(monthlyPlan) || 0;
        if (billFreq === 'Weekly') {
            finalAmount = finalAmount * 4.33;
        }

        try {
            setIsSavingObligation(true);
            const payload = {
                name,
                amount: finalAmount,
                priority: priority as 'high' | 'medium' | 'low'
            };

            if (editingObligationId) {
                await updateObligation(editingObligationId, payload);
                toast.success('Obligation updated');
            } else {
                await addObligation(payload);
                toast.success('Obligation added');
            }
            resetForm();
        } catch (err) {
            toast.error('Failed to save obligation');
        } finally {
            setIsSavingObligation(false);
        }
    };

    const handleEdit = (item: any, isObligation = false) => {
        resetForm();
        setName(item.name);
        setPriority(item.priority);

        if (isObligation) {
            setEditingObligationId(item.id);
            setMonthlyPlan(item.amount.toString());
        } else {
            setEditingGoalId(item.id);
            setTargetAmount(item.targetAmount.toString());
            setMonthlyPlan(item.monthlyPlan?.toString() || '');
            setAccountId(item.accountId?.toString() || '');
            setRefreshType(item.refreshType);
            setCurrentAmount(item.currentAmount?.toString() || '0');
            if (item.deadline) {
                setDeadline(new Date(item.deadline).toISOString().split('T')[0]);
            }
        }
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

                        <div className="form-row">
                            <div className="form-group">
                                <label className="field-label">Starting Balance</label>
                                <div className="input-wrapper">
                                    <span className="currency-prefix">₱</span>
                                    <input type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="field-label">Target Date</label>
                                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="styled-input-dark" />
                            </div>
                            <div className="form-group">
                                <label className="field-label">Priority</label>
                                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="styled-select-gold">
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>
                        {/* Hidden details for savings */}
                        <input type="hidden" value={refreshType} />

                        <div className="form-footer">
                            <button type="submit" className={`btn-blueprint-submit ${isSavingGoal ? 'btn-loading' : ''}`} disabled={isSavingGoal} onClick={() => setRefreshType('none')}>
                                {isSavingGoal ? (
                                    <div className="spinner" />
                                ) : (
                                    editingGoalId ? <Check size={18} /> : <Plus size={18} />
                                )}
                                <span>{isSavingGoal ? 'Saving...' : (editingGoalId ? 'Update Savings Goal' : 'Add Savings Goal')}</span>
                            </button>
                            {editingGoalId && <button type="button" onClick={resetForm} className="btn-text-sm danger">Cancel</button>}
                        </div>
                    </form>

                    <div className="goals-planner-list">
                        {savingsGoals.map(goal => {
                            const percent = (goal.currentAmount / goal.targetAmount) * 100;
                            return (
                                <div key={goal.id} className="goal-planner-item">
                                    <div className="goal-header-row">
                                        <div className="goal-main-info">
                                            <span className="goal-name">{goal.name}</span>
                                        </div>
                                        <div className="goal-menu-container">
                                            <button
                                                className="btn-actions-trigger"
                                                onClick={() => setOpenDropdownId(openDropdownId === goal.id ? null : (goal.id || null))}
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            {openDropdownId === goal.id && (
                                                <div className="actions-dropdown" ref={dropdownRef}>
                                                    <button className="dropdown-item" onClick={() => { setFundingGoal(goal); setOpenDropdownId(null); }}>
                                                        <DollarSign size={16} /> Fund Goal
                                                    </button>
                                                    <button className="dropdown-item" onClick={() => { handleEdit(goal); setOpenDropdownId(null); }}>
                                                        <Edit2 size={16} /> Edit Details
                                                    </button>
                                                    <div className="dropdown-divider"></div>
                                                    <button className="dropdown-item danger" onClick={() => { goal.id && deleteGoal(goal.id); setOpenDropdownId(null); }}>
                                                        <Trash2 size={16} /> Delete Goal
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="goal-meta-row">
                                        <div className="goal-target">
                                            <span>🎯</span>
                                            <span>₱ {goal.targetAmount.toLocaleString()}</span>
                                        </div>
                                        {(goal.monthlyPlan || 0) > 0 && (
                                            <div className="goal-monthly-plan">
                                                <span>📅</span>
                                                <span>₱ {goal.monthlyPlan.toLocaleString()}/mo</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="goal-progress-container">
                                        <div className="progress-label-row">
                                            <span>Progress</span>
                                            <span>{Math.round(percent)}%</span>
                                        </div>
                                        <div className="progress-bar-bg">
                                            <div className="progress-bar-fill goal" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                        </div>
                                        <div className="progress-values-row">
                                            <span>₱ {goal.currentAmount.toLocaleString()}</span>
                                            <span>₱ {goal.targetAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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

                    <form onSubmit={handleSaveObligation} className="add-expense-blueprint">
                        <div className="form-grid-blueprint">
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Bill Name (e.g. Rent)" required />
                            <div className="input-wrapper">
                                <span className="currency-prefix">₱</span>
                                <input type="number" value={monthlyPlan} onChange={e => setMonthlyPlan(e.target.value)} placeholder="Amount" required />
                            </div>
                            <select value={billFreq} onChange={e => setBillFreq(e.target.value as any)} className="styled-select-dark">
                                <option value="Monthly">Monthly</option>
                                <option value="Weekly">Weekly (Auto x4.33)</option>
                            </select>
                        </div>
                        <div className="form-meta-blueprint">
                            <div className="prio-select-group">
                                <span className="prio-label">Priority:</span>
                                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="styled-select-dark">
                                    <option value="high">High (Must Pay)</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <button type="submit" className={`btn-add-blueprint ${isSavingObligation ? 'btn-loading' : ''}`} disabled={isSavingObligation}>
                                {isSavingObligation ? (
                                    <div className="spinner" />
                                ) : (
                                    <Plus size={16} />
                                )}
                                <span>{isSavingObligation ? 'Saving...' : (editingObligationId ? 'Update Obligation' : 'Add Obligation')}</span>
                            </button>
                        </div>
                    </form>

                    <div className="blueprint-list">
                        {monthlyObligations.map(ob => (
                            <div key={ob.id} className="blueprint-item">
                                <div className="item-details">
                                    <span className="item-title">{ob.name}</span>
                                    <span className="item-meta">Priority: {ob.priority}</span>
                                </div>
                                <div className="item-amount">
                                    ₱ {(ob.amount || 0).toLocaleString()}
                                    <div className="item-actions">
                                        <button className="btn-icon-action" onClick={() => handleEdit(ob, true)} title="Edit Bill"><Edit2 size={14} /></button>
                                        <button className="btn-icon-action delete-sm" onClick={() => ob.id && deleteObligation(ob.id)} title="Delete Bill"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {fundingGoal && (
                <ContributeModal
                    goalName={fundingGoal.name}
                    defaultToAccountId={fundingGoal.accountId}
                    onClose={() => setFundingGoal(null)}
                    onSumit={async (amount, fromId, toId) => {
                        if (fundingGoal.id) {
                            await fundGoal(fundingGoal.id, amount, fromId, toId);
                            setFundingGoal(null);
                        }
                    }}
                />
            )}
        </div>
    );
};
