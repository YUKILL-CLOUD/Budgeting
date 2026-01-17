import React, { useState } from 'react';
import { PiggyBank, Wallet, Receipt, CheckCircle2, X } from 'lucide-react';
import { useGoalStore } from '../stores/goalStore';
import { useObligationStore } from '../stores/obligationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PaycheckAllocatorProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const PaycheckAllocator: React.FC<PaycheckAllocatorProps> = ({ isOpen, onClose }) => {
    const { goals } = useGoalStore();
    const { obligations } = useObligationStore();
    const [actualIncome, setActualIncome] = useState<number>(0);
    const [spendingAllowance, setSpendingAllowance] = useState<number>(2000); // Default allowance

    // 1. BLUEPRINT-ONLY LOGIC
    const unifiedItems: {
        id: string,
        name: string,
        weeklyMin: number,
        monthlyTarget: number,
        priority: 'high' | 'medium' | 'low',
        type: 'fixed' | 'saving'
    }[] = [];

    // 1. OBLIGATIONS (FIXED)
    obligations.forEach(ob => {
        const amount = Number(ob.amount) || 0;
        const weeklyNeed = amount / 4.33;
        unifiedItems.push({
            id: `ob-${ob.id}`,
            name: ob.name,
            weeklyMin: weeklyNeed,
            monthlyTarget: amount,
            priority: (ob.priority || 'high').toLowerCase() as 'high' | 'medium' | 'low',
            type: 'fixed'
        });
    });

    // 2. SAVINGS GOALS
    goals.forEach(goal => {
        const monthlyPlan = Number(goal.monthlyPlan) || 0;
        const targetAmount = Number(goal.targetAmount) || 0;
        const currentAmount = Number(goal.currentAmount) || 0;

        // If no monthly plan is set, we use the remaining target as the "total need" 
        // but for weekly worksheet, we usually fund the plan. 
        // Following "then" logic: Math.max(Monthly Plan, Total Target) for deciding priority need
        const fullMonthNeed = monthlyPlan > 0 ? monthlyPlan : Math.max(0, targetAmount - currentAmount);
        const weeklyNeed = fullMonthNeed / 4.33;

        unifiedItems.push({
            id: `goal-${goal.id}`,
            name: goal.name,
            weeklyMin: weeklyNeed,
            monthlyTarget: fullMonthNeed,
            priority: (goal.priority || 'medium').toLowerCase() as 'high' | 'medium' | 'low',
            type: 'saving'
        });
    });

    // 2. ULTIMATE BALANCED WATERFALL
    let pool = actualIncome - spendingAllowance;
    const suggestions: Record<string, number> = {};
    unifiedItems.forEach(i => suggestions[i.id] = 0);

    // --- PASS 1: SURVIVAL WATERFALL (Democratic Split for High priority) ---
    let highPriorityItems = unifiedItems.filter(item => item.priority === 'high' && item.weeklyMin > 0);

    while (pool > 0.5 && highPriorityItems.length > 0) {
        const share = pool / highPriorityItems.length;
        let poolConsumedThisRound = 0;

        highPriorityItems.forEach(item => {
            const currentAmount = suggestions[item.id] || 0;
            const stillNeeded = item.weeklyMin - currentAmount;
            const amountToApply = Math.min(share, stillNeeded);
            suggestions[item.id] = currentAmount + amountToApply;
            poolConsumedThisRound += amountToApply;
        });

        pool -= poolConsumedThisRound;
        highPriorityItems = highPriorityItems.filter(item => (item.weeklyMin - (suggestions[item.id] || 0)) > 0.5);
        if (poolConsumedThisRound < 0.1) break;
    }

    // --- PASS 2: BALANCED GROWTH SPLIT (All Priorities) ---
    let activeGoals = unifiedItems.filter(item => (item.monthlyTarget - (suggestions[item.id] || 0)) > 0.5);

    while (pool > 0.5 && activeGoals.length > 0) {
        const share = pool / activeGoals.length;
        let poolConsumedThisRound = 0;

        activeGoals.forEach(item => {
            const currentAmount = suggestions[item.id] || 0;
            const stillNeeded = item.monthlyTarget - currentAmount;
            const amountToApply = Math.min(share, stillNeeded);
            suggestions[item.id] = currentAmount + amountToApply;
            poolConsumedThisRound += amountToApply;
        });

        pool -= poolConsumedThisRound;
        activeGoals = activeGoals.filter(item => (item.monthlyTarget - (suggestions[item.id] || 0)) > 0.5);

        if (poolConsumedThisRound < 0.1) break;
    }

    // 3. FINAL CALCULATIONS
    const finalSurplus = pool > 0 ? pool : 0;
    const totalPocketMoney = spendingAllowance + finalSurplus;
    const shortfall = pool < 0 ? Math.abs(pool) : 0;

    const fixedObligations = unifiedItems.filter(i => i.type === 'fixed');
    const savingsTargets = unifiedItems.filter(i => i.type === 'saving');

    const content = (
        <div className="space-y-6 max-w-7xl mx-auto p-1">
            {!isOpen && (
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Receipt className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Paycheck Worksheet</h2>
                        <p className="text-sm text-slate-400">Blueprint-driven allocation for this week's income</p>
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white">
                        <Wallet size={24} />
                        <h2 className="text-xl font-bold">Paycheck Worksheet</h2>
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </Button>
                    )}
                </div>
            )}

            {/* Inputs Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900/50 border border-indigo-500/30 rounded-xl p-6 shadow-lg">
                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 block">Actual Weekly Income</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-500">₱</span>
                        <Input
                            type="number"
                            className="pl-10 h-16 text-3xl font-bold bg-slate-950/50 border-indigo-500/30 focus-visible:ring-indigo-500 text-white"
                            value={actualIncome || ''}
                            onChange={(e) => setActualIncome(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                    <label className="text-xs font-bold text-amber-500/80 uppercase tracking-widest mb-3 block">Pocket Spending Allowance</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">₱</span>
                        <Input
                            type="number"
                            className="pl-8 h-12 text-xl font-bold bg-slate-950/50 border-amber-500/30 focus-visible:ring-amber-500 text-white"
                            value={spendingAllowance || ''}
                            onChange={(e) => setSpendingAllowance(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isOpen ? '' : ''}`}>

                {/* 💳 Column 1: Bills & Loans */}
                <Card className="bg-[#1e293b] border-white/5 shadow-xl flex flex-col h-full">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-md">
                                <Receipt className="text-emerald-500" size={20} />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-white">Bills & Loans</CardTitle>
                                <CardDescription className="text-emerald-400 font-medium">Monthly Obligations</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto max-h-[500px] p-0">
                        <div className="divide-y divide-white/5">
                            {fixedObligations.map(item => (
                                <div key={item.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-slate-200 truncate pr-2" title={item.name}>{item.name}</span>
                                        <Badge variant="outline" className={`
                                            uppercase text-[10px] tracking-wider border-0 font-bold px-1.5 py-0.5
                                            ${item.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}
                                        `}>
                                            {item.priority}
                                        </Badge>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <div className="text-lg font-bold text-white">
                                            <span className="text-emerald-400">₱ {Math.round(suggestions[item.id]).toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Target: ₱ {Math.round(item.monthlyTarget).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {fixedObligations.length === 0 && (
                                <div className="p-8 text-center text-slate-500 text-sm italic">No obligations found.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 🎯 Column 2: Savings Goals */}
                <Card className="bg-[#1e293b] border-white/5 shadow-xl flex flex-col h-full">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-md">
                                <PiggyBank className="text-indigo-500" size={20} />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-white">Savings Goals</CardTitle>
                                <CardDescription className="text-indigo-400 font-medium">Balanced Shared Growth</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto max-h-[500px] p-0">
                        <div className="divide-y divide-white/5">
                            {savingsTargets.map(item => (
                                <div key={item.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-slate-200 truncate pr-2" title={item.name}>{item.name}</span>
                                        <Badge variant="outline" className={`
                                            uppercase text-[10px] tracking-wider border-0 font-bold px-1.5 py-0.5
                                            ${item.priority === 'high' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/10 text-blue-400'}
                                        `}>
                                            {item.priority}
                                        </Badge>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <div className="text-lg font-bold text-white">
                                            <span className="text-indigo-400">₱ {Math.round(suggestions[item.id]).toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Target: ₱ {Math.round(item.monthlyTarget).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {savingsTargets.length === 0 && (
                                <div className="p-8 text-center text-slate-500 text-sm italic">No savings goals found.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 🛍️ Column 3: Spending Summary */}
                <Card className="bg-[#1e293b] border-white/5 shadow-xl flex flex-col h-full border-t-4 border-t-amber-500/50">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-md">
                                <Wallet className="text-amber-500" size={20} />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-white">Spending Cash</CardTitle>
                                <CardDescription className="text-amber-400 font-medium">Remaining Surplus</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-white/5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Base Allowance:</span>
                                <span className="text-slate-200 font-medium">₱ {Math.round(spendingAllowance).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Income Surplus:</span>
                                <span className="text-emerald-400 font-bold">+ ₱ {Math.round(finalSurplus).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-xl border border-amber-500/20">
                            <span className="text-xs uppercase tracking-widest text-amber-500/80 font-bold block mb-1">Total Pocket Money</span>
                            <span className={`text-3xl font-black ${shortfall > 0 ? 'text-red-400' : 'text-white'}`}>
                                ₱ {Math.round(totalPocketMoney).toLocaleString()}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Weekly Checklist:</p>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {unifiedItems.filter(i => suggestions[i.id] > 0.5).map(item => (
                                    <div key={`check-${item.id}`} className="flex items-start gap-3 p-2 rounded-md hover:bg-white/5 transition-colors">
                                        <CheckCircle2 size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                                        <span className="text-sm text-slate-300">
                                            Move <span className="text-white font-bold">₱{Math.round(suggestions[item.id]).toLocaleString()}</span> to <strong className="text-slate-200">{item.name}</strong>
                                        </span>
                                    </div>
                                ))}
                                <div className="flex items-start gap-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                                    <CheckCircle2 size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-slate-200">
                                        Keep <span className="text-white font-bold">₱{Math.round(totalPocketMoney).toLocaleString()}</span> for <strong className="text-amber-400">Daily Spending</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    if (isOpen) {
        return (
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl h-[90vh] overflow-hidden flex flex-col bg-[#0f172a] border-white/10 p-0">
                    <div className="overflow-y-auto p-6">
                        {content}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return content;
};
