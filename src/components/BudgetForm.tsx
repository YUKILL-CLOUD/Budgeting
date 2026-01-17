import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Trophy, Edit2, Receipt, MoreVertical, DollarSign } from 'lucide-react';
import { useGoalStore } from '../stores/goalStore';
import { useAccountStore } from '../stores/accountStore';
import { useObligationStore } from '../stores/obligationStore';
import { ContributeModal } from './ContributeModal';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

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
                {/* SAVINGS SECTION */}
                <section className="card card-savings">
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <div className="header-title-group">
                            <Trophy style={{ color: '#fbbf24' }} size={24} />
                            <div>
                                <h2>Savings Targets</h2>
                                <p className="subtitle">Long-term goals & Wishlist</p>
                            </div>
                        </div>
                        <Dialog open={!!editingGoalId || (isSavingGoal && !editingGoalId) ? true : undefined} onOpenChange={(open) => {
                            if (!open) resetForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
                                    <Plus className="mr-2 h-4 w-4" /> Add Goal
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-[#1e293b] border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>{editingGoalId ? 'Edit Savings Goal' : 'Add New Savings Target'}</DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        Set a financial goal to track your progress.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSaveGoal} className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="name" className="text-right text-sm font-medium text-slate-300">
                                            Name
                                        </label>
                                        <input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="col-span-3 flex h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                            placeholder="e.g. New Laptop"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="target" className="text-right text-sm font-medium text-slate-300">
                                            Target
                                        </label>
                                        <div className="col-span-3 relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">₱</span>
                                            <input
                                                id="target"
                                                type="number"
                                                value={targetAmount}
                                                onChange={(e) => setTargetAmount(e.target.value)}
                                                className="flex h-9 w-full rounded-md border border-white/10 bg-slate-800 pl-7 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-500 text-white"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label className="text-right text-sm font-medium text-slate-300">
                                            Priority
                                        </label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as any)}
                                            className="col-span-3 flex h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-500 text-white"
                                        >
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label className="text-right text-sm font-medium text-slate-300">
                                            Account
                                        </label>
                                        <select
                                            value={accountId}
                                            onChange={(e) => setAccountId(e.target.value)}
                                            className="col-span-3 flex h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-500 text-white"
                                        >
                                            <option value="">None</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                        </select>
                                    </div>

                                    {!editingGoalId && (
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <label htmlFor="start" className="text-right text-sm font-medium text-slate-300">
                                                Start Bal
                                            </label>
                                            <div className="col-span-3 relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">₱</span>
                                                <input
                                                    id="start"
                                                    type="number"
                                                    value={currentAmount}
                                                    onChange={(e) => setCurrentAmount(e.target.value)}
                                                    className="flex h-9 w-full rounded-md border border-white/10 bg-slate-800 pl-7 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-500 text-white"
                                                    placeholder="Optional starting amount"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <DialogFooter>
                                        <Button type="submit" disabled={isSavingGoal} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 w-full sm:w-auto">
                                            {isSavingGoal ? 'Saving...' : (editingGoalId ? 'Update Goal' : 'Create Goal')}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

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
                {/* BILLS SECTION */}
                <section className="card card-expenses">
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <div className="header-title-group">
                            <Receipt className="text-pink" size={24} />
                            <div>
                                <h2>Monthly Obligations</h2>
                                <p className="subtitle">Recurring bills & Fixed costs</p>
                            </div>
                        </div>
                        <Dialog open={!!editingObligationId || (isSavingObligation && !editingObligationId) ? true : undefined} onOpenChange={(open) => {
                            if (!open) resetForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-pink-500 hover:bg-pink-600 text-white border-0">
                                    <Plus className="mr-2 h-4 w-4" /> Add Bill
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-[#1e293b] border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>{editingObligationId ? 'Edit Obligation' : 'Add Monthly Bill'}</DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        Track your recurring expenses like rent or internet.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSaveObligation} className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="billName" className="text-right text-sm font-medium text-slate-300">
                                            Name
                                        </label>
                                        <input
                                            id="billName"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="col-span-3 flex h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                            placeholder="e.g. Netflix"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="billAmount" className="text-right text-sm font-medium text-slate-300">
                                            Amount
                                        </label>
                                        <div className="col-span-3 relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">₱</span>
                                            <input
                                                id="billAmount"
                                                type="number"
                                                value={monthlyPlan}
                                                onChange={(e) => setMonthlyPlan(e.target.value)}
                                                className="flex h-9 w-full rounded-md border border-white/10 bg-slate-800 pl-7 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 text-white"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label className="text-right text-sm font-medium text-slate-300">
                                            Frequency
                                        </label>
                                        <select
                                            value={billFreq}
                                            onChange={(e) => setBillFreq(e.target.value as any)}
                                            className="col-span-3 flex h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 text-white"
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Weekly">Weekly (Auto x4.33)</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label className="text-right text-sm font-medium text-slate-300">
                                            Priority
                                        </label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as any)}
                                            className="col-span-3 flex h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 text-white"
                                        >
                                            <option value="high">High (Must Pay)</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>

                                    <DialogFooter>
                                        <Button type="submit" disabled={isSavingObligation} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 w-full sm:w-auto">
                                            {isSavingObligation ? 'Saving...' : (editingObligationId ? 'Update Bill' : 'Add Bill')}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

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
