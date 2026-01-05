import React, { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Calendar, Trophy, Link2, Check, Edit2, MoreVertical } from 'lucide-react';
import type { Income, Expense, ExpenseFrequency } from '../types';
import { useGoalStore } from '../stores/goalStore';
import { useAccountStore } from '../stores/accountStore';
import { ContributeModal } from './ContributeModal';
import { toast } from 'sonner';

interface BudgetFormProps {
    incomes: Income[];
    setIncomes: React.Dispatch<React.SetStateAction<Income[]>>;
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    savings: number; // Sum of goals
    setSavings: (amount: number) => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
    incomes,
    setIncomes,
    expenses,
    setExpenses,
    setSavings
}) => {
    const { goals, addGoal, updateGoal, deleteGoal, fetchGoals } = useGoalStore();
    const { accounts } = useAccountStore();

    // Expense Form State
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [newExpenseName, setNewExpenseName] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState('');
    const [newExpenseFreq, setNewExpenseFreq] = useState<ExpenseFrequency>('Monthly');
    const [newExpenseFlexible, setNewExpenseFlexible] = useState(false);

    // Goal Form State
    const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');
    const [newGoalAccountId, setNewGoalAccountId] = useState<string>('');
    const [newGoalTrackingType, setNewGoalTrackingType] = useState<'auto' | 'manual'>('manual');
    const [newGoalRefreshType, setNewGoalRefreshType] = useState<'none' | 'monthly'>('none');
    const [newGoalMonthlyPlan, setNewGoalMonthlyPlan] = useState('');
    const [newGoalPriority, setNewGoalPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [newGoalDeadline, setNewGoalDeadline] = useState('');
    const [contributeGoal, setContributeGoal] = useState<any | null>(null);
    const [activeGoalMenu, setActiveGoalMenu] = useState<number | null>(null);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    // Update parent savings state whenever goals change
    useEffect(() => {
        // Calculate based on monthly plan, not total target amount
        const total = goals.reduce((acc, g) => acc + (g.monthlyPlan || 0), 0);
        setSavings(total);
    }, [goals, setSavings]);

    const addIncome = () => {
        const newIncome: Income = {
            id: crypto.randomUUID(),
            source: `Source ${incomes.length + 1}`,
            weeklyAmount: 0,
        };
        setIncomes([...incomes, newIncome]);
    };

    const updateIncome = (id: string, amount: number) => {
        setIncomes(incomes.map(inc => inc.id === id ? { ...inc, weeklyAmount: amount } : inc));
    };

    const removeIncome = (id: string) => {
        setIncomes(incomes.filter(inc => inc.id !== id));
    };

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoalName || !newGoalTarget) return;

        try {
            if (editingGoalId) {
                await updateGoal(editingGoalId, {
                    name: newGoalName,
                    targetAmount: parseFloat(newGoalTarget),
                    monthlyPlan: parseFloat(newGoalMonthlyPlan) || 0,
                    accountId: newGoalAccountId ? parseInt(newGoalAccountId) : undefined,
                    trackingType: newGoalTrackingType,
                    refreshType: newGoalRefreshType,
                    priority: newGoalPriority,
                });
                toast.success('Goal updated');
            } else {
                await addGoal({
                    name: newGoalName,
                    targetAmount: parseFloat(newGoalTarget),
                    monthlyPlan: parseFloat(newGoalMonthlyPlan) || 0,
                    currentAmount: 0,
                    accountId: newGoalAccountId ? parseInt(newGoalAccountId) : undefined,
                    trackingType: newGoalTrackingType,
                    refreshType: newGoalRefreshType,
                    priority: newGoalPriority,
                    deadline: newGoalDeadline ? new Date(newGoalDeadline) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    status: 'active'
                });
                toast.success(`Goal "${newGoalName}" added`);
            }
            setNewGoalName('');
            setNewGoalTarget('');
            setNewGoalMonthlyPlan('');
            setNewGoalAccountId('');
            setNewGoalTrackingType('manual');
            setNewGoalRefreshType('none');
            setNewGoalPriority('medium');
            setNewGoalDeadline('');
            setEditingGoalId(null);
        } catch (err) {
            toast.error('Failed to save goal');
        }
    };

    const handleContribute = (goal: any) => {
        setContributeGoal(goal);
    };

    const submitContribution = async (amount: number) => {
        if (!contributeGoal) return;

        await updateGoal(contributeGoal.id, {
            currentAmount: (contributeGoal.currentAmount || 0) + amount
        });
        toast.success(`Allocated ₱${amount.toLocaleString()} to ${contributeGoal.name}`);
        setContributeGoal(null);
    };

    const handleEditGoal = (goal: any) => {
        setEditingGoalId(goal.id);
        setNewGoalName(goal.name);
        setNewGoalTarget(goal.targetAmount.toString());
        setNewGoalMonthlyPlan(goal.monthlyPlan?.toString() || '');
        setNewGoalAccountId(goal.accountId?.toString() || '');
        setNewGoalTrackingType(goal.trackingType || 'manual');
        setNewGoalRefreshType(goal.refreshType || 'none');
        setNewGoalPriority(goal.priority || 'medium');
    };

    const addExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpenseName || !newExpenseAmount) return;

        if (!editingExpenseId && expenses.some(exp => exp.name.toLowerCase() === newExpenseName.trim().toLowerCase())) {
            toast.error('This expense already exists!');
            return;
        }

        if (editingExpenseId) {
            setExpenses(expenses.map(exp => exp.id === editingExpenseId ? {
                ...exp,
                name: newExpenseName,
                amount: parseFloat(newExpenseAmount),
                frequency: newExpenseFreq,
                isFlexible: newExpenseFlexible
            } : exp));
            toast.success('Expense updated');
            setEditingExpenseId(null);
        } else {
            const newExpense: Expense = {
                id: crypto.randomUUID(),
                name: newExpenseName,
                amount: parseFloat(newExpenseAmount),
                frequency: newExpenseFreq,
                isFlexible: newExpenseFlexible,
            };
            setExpenses([...expenses, newExpense]);
            toast.success(`Added ${newExpenseName}`);
        }

        setNewExpenseName('');
        setNewExpenseAmount('');
        setNewExpenseFreq('Monthly');
        setNewExpenseFlexible(false);
    };

    const handleEditExpense = (exp: Expense) => {
        setEditingExpenseId(exp.id);
        setNewExpenseName(exp.name);
        setNewExpenseAmount(exp.amount.toString());
        setNewExpenseFreq(exp.frequency);
        setNewExpenseFlexible(exp.isFlexible);
    };

    return (
        <div className="budget-form-container">
            {/* Income Section */}
            <section className="card card-income">
                <div className="card-header border-accent">
                    <div className="header-title-group">
                        <DollarSign className="text-secondary" size={24} />
                        <div>
                            <h2>Expected Income</h2>
                            <p className="subtitle">Projected weekly earnings</p>
                        </div>
                    </div>
                </div>
                <div className="input-group-list">
                    {incomes.map((income, index) => (
                        <div key={income.id} className="input-row">
                            <span className="row-label">Source #{index + 1}</span>
                            <div className="input-wrapper">
                                <span className="currency-prefix">₱</span>
                                <input
                                    type="number"
                                    value={income.weeklyAmount || ''}
                                    onChange={(e) => updateIncome(income.id, parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </div>
                            <button onClick={() => removeIncome(income.id)} className="btn-icon-danger">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button onClick={addIncome} className="btn-add-item">
                        <Plus size={16} /> Add Income Source
                    </button>
                </div>
            </section>

            {/* Savings Goals Section */}
            <section className="card card-savings">
                <div className="card-header border-gold">
                    <div className="header-title-group">
                        <Trophy style={{ color: '#fbbf24' }} size={24} />
                        <div>
                            <h2>Savings Blueprint</h2>
                            <p className="subtitle">Long-term targets and goals</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleAddGoal} className="goal-blueprint-form">
                    <div className="form-section">
                        <div className="form-group flex-2">
                            <label className="field-label caps">Goal Name</label>
                            <input
                                type="text"
                                value={newGoalName}
                                onChange={e => setNewGoalName(e.target.value)}
                                placeholder="e.g. Dream Motorcycle"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="field-label caps">🎯 Total Target</label>
                            <div className="input-wrapper-gold">
                                <span className="currency">₱</span>
                                <input
                                    type="number"
                                    value={newGoalTarget}
                                    onChange={e => setNewGoalTarget(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="field-label caps">📅 Monthly Plan</label>
                            <div className="input-wrapper-gold">
                                <span className="currency">₱</span>
                                <input
                                    type="number"
                                    value={newGoalMonthlyPlan}
                                    onChange={e => setNewGoalMonthlyPlan(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="field-label caps">Linked Account</label>
                            <select
                                value={newGoalAccountId}
                                onChange={e => setNewGoalAccountId(e.target.value)}
                                className="styled-select-gold"
                            >
                                <option value="">No Account Link</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="field-label caps">Tracking Mode</label>
                            <select
                                value={newGoalTrackingType}
                                onChange={e => setNewGoalTrackingType(e.target.value as any)}
                                className="styled-select-gold"
                            >
                                <option value="manual">Manual Allocation (I record what I save)</option>
                                <option value="auto">Auto-Track (Based on bank balance)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label className="field-label caps">Frequency/Reset</label>
                            <select
                                value={newGoalRefreshType}
                                onChange={e => setNewGoalRefreshType(e.target.value as any)}
                                className="styled-select-gold"
                            >
                                <option value="none">Fixed Goal (Keep saving until reached)</option>
                                <option value="monthly">Refreshes Monthly (Reset per month)</option>
                            </select>
                        </div>
                        <div className="form-group flex-1">
                            <label className="field-label caps">Priority</label>
                            <select
                                value={newGoalPriority}
                                onChange={e => setNewGoalPriority(e.target.value as any)}
                                className="styled-select-gold"
                            >
                                <option value="high">🔴 High (Must Pay First)</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="low">🟢 Low (If Extra Funds)</option>
                            </select>
                        </div>
                        <div className="form-group flex-0">
                            <label className="field-label caps">&nbsp;</label>
                            <button type="submit" className="btn-blueprint-submit">
                                {editingGoalId ? <Check size={18} /> : <Plus size={18} />}
                                <span>{editingGoalId ? 'Update' : 'Create'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="form-footer-hint">
                        <p className="hint-text">
                            The <b>Monthly Plan</b> is used in your Financial Blueprint calculation to ensure you're not overspending.
                        </p>
                        {editingGoalId && <button onClick={() => setEditingGoalId(null)} className="btn-text-sm danger">Cancel Edit</button>}
                    </div>
                </form>

                <div className="goals-planner-list">
                    {goals.map(goal => {
                        const linkedAccount = accounts.find(a => a.id === goal.accountId);
                        return (
                            <div key={goal.id} className="goal-planner-item">
                                <div className="goal-main-info">
                                    <span className="goal-name">{goal.name}</span>
                                    <div className="goal-meta-row">
                                        <span className="goal-target" title="Total Target">🎯 ₱ {goal.targetAmount.toLocaleString()}</span>
                                        <span className="goal-monthly-plan" title="Monthly Plan">📅 ₱ {(goal.monthlyPlan || 0).toLocaleString()}/mo</span>
                                        {linkedAccount && (
                                            <span className="goal-link-tag">
                                                <Link2 size={12} />
                                                {linkedAccount.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="goal-menu-container">
                                    <button
                                        className="btn-icon-menu"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveGoalMenu(activeGoalMenu === goal.id ? null : goal.id || null);
                                        }}
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {activeGoalMenu === goal.id && (
                                        <>
                                            <div className="menu-backdrop" onClick={() => setActiveGoalMenu(null)} />
                                            <div className="goal-dropdown-menu">
                                                {goal.trackingType === 'manual' && (
                                                    <button className="menu-item contribute" onClick={() => { handleContribute(goal); setActiveGoalMenu(null); }}>
                                                        <Plus size={16} />
                                                        <span>Add Funds</span>
                                                    </button>
                                                )}
                                                <button className="menu-item edit" onClick={() => { handleEditGoal(goal); setActiveGoalMenu(null); }}>
                                                    <Edit2 size={16} />
                                                    <span>Edit Goal</span>
                                                </button>
                                                <button className="menu-item delete" onClick={() => { goal.id && deleteGoal(goal.id); setActiveGoalMenu(null); }}>
                                                    <Trash2 size={16} />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {goals.length === 0 && <p className="empty-hint">No savings goals yet.</p>}
                </div>
            </section>

            {contributeGoal && (
                <ContributeModal
                    goalName={contributeGoal.name}
                    onClose={() => setContributeGoal(null)}
                    onSumit={submitContribution}
                />
            )}

            {/* Expenses Section */}
            <section className="card card-expenses">
                <div className="card-header border-pink">
                    <div className="header-title-group">
                        <Calendar className="text-pink" size={24} />
                        <div>
                            <h2>Planned Bills & Costs</h2>
                            <p className="subtitle">Fixed and flexible projected costs</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={addExpense} className="add-expense-blueprint">
                    <div className="form-grid-blueprint">
                        <input
                            type="text"
                            value={newExpenseName}
                            onChange={(e) => setNewExpenseName(e.target.value)}
                            placeholder="Bill Name"
                            required
                        />
                        <div className="input-wrapper">
                            <span className="currency-prefix">₱</span>
                            <input
                                type="number"
                                value={newExpenseAmount}
                                onChange={(e) => setNewExpenseAmount(e.target.value)}
                                placeholder="Amount"
                                required
                            />
                        </div>
                        <select
                            value={newExpenseFreq}
                            onChange={(e) => setNewExpenseFreq(e.target.value as ExpenseFrequency)}
                        >
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Annual">Annual</option>
                        </select>
                    </div>

                    <div className="form-meta-blueprint">
                        <label className={`flexible-toggle-pill ${newExpenseFlexible ? 'active' : ''}`}>
                            <input
                                type="checkbox"
                                checked={newExpenseFlexible}
                                onChange={(e) => setNewExpenseFlexible(e.target.checked)}
                            />
                            <div className="toggle-dot"></div>
                            <span>Flexible Spending?</span>
                        </label>
                        <button type="submit" className="btn-add-blueprint">
                            {editingExpenseId ? <Check size={16} /> : <Plus size={16} />}
                            {editingExpenseId ? 'Update Item' : 'Add to Plan'}
                        </button>
                        {editingExpenseId && <button onClick={() => setEditingExpenseId(null)} className="btn-text-sm">Cancel Edit</button>}
                    </div>
                </form>

                <div className="blueprint-list">
                    {expenses.map(expense => (
                        <div key={expense.id} className="blueprint-item">
                            <div className="item-details">
                                <span className="item-title">{expense.name}</span>
                                <span className="item-meta">{expense.frequency} • {expense.isFlexible ? 'Flexible' : 'Fixed'}</span>
                            </div>
                            <div className="item-amount">
                                ₱ {expense.amount.toLocaleString()}
                                <div className="item-actions">
                                    <button onClick={() => handleEditExpense(expense)} className="btn-icon-action edit-sm">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => setExpenses(expenses.filter(e => e.id !== expense.id))} className="btn-icon-action delete-sm">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div >
    );
};
