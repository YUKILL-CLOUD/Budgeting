import React, { useMemo, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useTransactionStore } from '../stores/transactionStore';
import { useAccountStore } from '../stores/accountStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useGoalStore } from '../stores/goalStore';
import { useObligationStore } from '../stores/obligationStore';
import { format, subDays, eachDayOfInterval, isSameDay, startOfMonth } from 'date-fns';
import { DollarSign, Activity, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Target, Flame, Trophy, Link2, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


interface MainDashboardProps { }

export const MainDashboard: React.FC<MainDashboardProps> = () => {
    const { transactions } = useTransactionStore();
    const { accounts } = useAccountStore();
    const { categories } = useCategoryStore();
    const { goals, fetchGoals } = useGoalStore();
    const { obligations, fetchObligations } = useObligationStore();

    useEffect(() => {
        fetchGoals();
        fetchObligations();
    }, [fetchGoals, fetchObligations]);

    // 1. Calculate Summary Stats
    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

    const monthlyIncome = useMemo(() => {
        const start = startOfMonth(new Date());
        return transactions
            .filter(t => t.type === 'income' && new Date(t.date) >= start)
            .reduce((acc, t) => acc + t.amount, 0);
    }, [transactions]);

    const monthlyExpenses = useMemo(() => {
        const start = startOfMonth(new Date());
        return transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= start)
            .reduce((acc, t) => acc + t.amount, 0);
    }, [transactions]);

    // 2. Budget Progress Stats
    const totalMonthlyPlanned = useMemo(() => {
        const goalTotal = goals.reduce((sum, g) => sum + (g.monthlyPlan || 0), 0);
        const obTotal = obligations.reduce((sum, o) => sum + (o.amount || 0), 0);
        return goalTotal + obTotal;
    }, [goals, obligations]);

    // Estimate allowance as what's left after bills, or just 50% of income for now as a fallback if no plan.
    // Ideally this comes from a 'Settings' store.
    const totalWeeklyAllowance = totalBalance > 0 ? (totalBalance * 0.1) : 2000; // Placeholder until we persist 'Pocket Money' settings

    const weeklySpent = useMemo(() => {
        const sevenDaysAgo = subDays(new Date(), 7);
        return transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= sevenDaysAgo)
            .reduce((acc, t) => acc + t.amount, 0);
    }, [transactions]);

    const budgetUsagePercent = totalMonthlyPlanned > 0 ? (monthlyExpenses / totalMonthlyPlanned) * 100 : 0;
    const weeklyUsagePercent = totalWeeklyAllowance > 0 ? (weeklySpent / totalWeeklyAllowance) * 100 : 0;

    // 3. Comparison Data (Monthly Performance)
    const comparisonData = [
        { name: 'Income', amount: monthlyIncome, fill: '#10b981' },
        { name: 'Expenses', amount: monthlyExpenses, fill: '#ec4899' },
        { name: 'Blueprint', amount: totalMonthlyPlanned, fill: '#6366f1' }
    ];

    // 4. Trend Data (Last 7 Days)
    const trendData = useMemo(() => {
        const last7Days = eachDayOfInterval({
            start: subDays(new Date(), 6),
            end: new Date(),
        });

        return last7Days.map(day => {
            const dayExpenses = transactions.filter(t =>
                t.type === 'expense' && isSameDay(new Date(t.date), day)
            );
            const dayIncome = transactions.filter(t =>
                t.type === 'income' && isSameDay(new Date(t.date), day)
            );
            return {
                date: format(day, 'MMM dd'),
                expenses: dayExpenses.reduce((acc, t) => acc + t.amount, 0),
                income: dayIncome.reduce((acc, t) => acc + t.amount, 0),
            };
        });
    }, [transactions]);

    // 5. Category Breakdown (Actual Spending)
    const categoryData = useMemo(() => {
        const totals: Record<number, number> = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                if (t.categoryId) {
                    totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount;
                }
            });

        return Object.entries(totals)
            .map(([id, amount]) => ({
                name: categories.find(c => c.id === parseInt(id))?.name || 'Other',
                value: amount,
                color: categories.find(c => c.id === parseInt(id))?.color || '#94a3b8'
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [transactions, categories]);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <LayoutDashboard size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Personal Dashboard</h2>
                    <p className="text-slate-400">Your financial overview at a glance</p>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-800 border-slate-700/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Total Net Worth</p>
                            <h3 className="text-2xl font-bold text-white">₱ {totalBalance.toLocaleString()}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400">
                            <ArrowUpRight size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Monthly Income</p>
                            <h3 className="text-2xl font-bold text-white">₱ {monthlyIncome.toLocaleString()}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 rounded-full bg-pink-500/10 text-pink-400">
                            <ArrowDownRight size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Monthly Expenses</p>
                            <h3 className="text-2xl font-bold text-white">₱ {monthlyExpenses.toLocaleString()}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7-Day Spending Trend */}
                <Card className="bg-slate-800 border-slate-700/50 lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Activity size={20} className="text-indigo-400" />
                            <CardTitle className="text-xl text-white">Weekly Cash Flow</CardTitle>
                        </div>
                        <CardDescription>Income vs Expenses (Last 7 days)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `₱${val}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="income"
                                        name="Income"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expenses"
                                        name="Expenses"
                                        stroke="#ec4899"
                                        strokeWidth={3}
                                        dot={{ fill: '#ec4899', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Comparison */}
                <Card className="bg-slate-800 border-slate-700/50">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Target size={20} className="text-emerald-400" />
                            <CardTitle className="text-xl text-white">Monthly Performance</CardTitle>
                        </div>
                        <CardDescription>Income vs Expenses vs Plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} margin={{ top: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Budget Health (Condensed) and Category Heatmap */}
                <Card className="bg-slate-800 border-slate-700/50">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Flame size={20} className="text-orange-400" />
                            <CardTitle className="text-xl text-white">Burn Rate</CardTitle>
                        </div>
                        <CardDescription>Are you sticking to the plan?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-400">Monthly Budget</span>
                                    <span className="font-bold text-white">{budgetUsagePercent.toFixed(0)}%</span>
                                </div>
                                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${budgetUsagePercent > 90 ? 'bg-red-500' : budgetUsagePercent > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-400">Weekly Allowance</span>
                                    <span className="font-bold text-white">{weeklyUsagePercent.toFixed(0)}%</span>
                                </div>
                                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${weeklyUsagePercent > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(weeklyUsagePercent, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-700/50">
                            <div className="flex items-center gap-2 mb-4">
                                <PieIcon size={16} className="text-indigo-400" />
                                <h3 className="font-semibold text-slate-300">Top Spending</h3>
                            </div>
                            <div className="h-[150px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} axisLine={false} tickLine={false} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Savings Goals */}
                <Card className="bg-slate-800 border-slate-700/50 lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Trophy size={20} className="text-yellow-500" />
                            <CardTitle className="text-xl text-white">Savings Goals</CardTitle>
                        </div>
                        <CardDescription>Progress on your long-term targets</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {goals.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-500">
                                    <p>No active goals.</p>
                                    <span className="text-sm">Add some in the Planning tab!</span>
                                </div>
                            ) : (
                                goals.map(goal => {
                                    // Smart Link: If tracking is 'auto', use account balance. If 'manual', use stored allocated amount.
                                    const linkedAccount = goal.accountId ? accounts.find(a => a.id === goal.accountId) : null;
                                    const isAuto = goal.trackingType === 'auto';
                                    const currentAmt = (isAuto && linkedAccount) ? linkedAccount.balance : goal.currentAmount;
                                    const percent = (currentAmt / goal.targetAmount) * 100;

                                    return (
                                        <div key={goal.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-yellow-500/30 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-white">{goal.name}</h4>
                                                    {linkedAccount && (
                                                        <span className="flex items-center gap-1 text-xs text-indigo-400 mt-0.5">
                                                            <Link2 size={10} />
                                                            {linkedAccount.name} {isAuto ? '(Auto)' : '(Allocated)'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-yellow-500 font-bold text-sm block">{percent.toFixed(0)}%</span>
                                                    <span className="text-[10px] text-slate-500">of ₱{goal.targetAmount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"
                                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                                />
                                            </div>
                                            <div className="mt-2 text-xs text-slate-400 text-right">
                                                ₱ {currentAmt.toLocaleString()} saved
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
