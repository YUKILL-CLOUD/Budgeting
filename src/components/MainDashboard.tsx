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
        <div className="dashboard-container">
            <div className="tab-page-header">
                <div className="header-with-icon">
                    <div className="header-icon-pill">
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h2 className="page-title">Personal Dashboard</h2>
                        <p className="page-subtitle">Your financial overview at a glance</p>
                    </div>
                </div>
            </div>

            <div className="main-dashboard">
                {/* Top Stat Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon-wrapper balance">
                            <DollarSign size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Total Net Worth</span>
                            <span className="stat-value">₱ {totalBalance.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon-wrapper income">
                            <ArrowUpRight size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Month Income</span>
                            <span className="stat-value">₱ {monthlyIncome.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon-wrapper expense">
                            <ArrowDownRight size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Month Expenses</span>
                            <span className="stat-value">₱ {monthlyExpenses.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-charts-grid">
                    {/* 7-Day Spending Trend */}
                    <div className="card chart-container">
                        <div className="card-header">
                            <div className="header-with-icon">
                                <Activity size={20} className="text-accent" />
                                <h2>Weekly Cash Flow</h2>
                            </div>
                            <p className="subtitle">Income vs Expenses (Last 7 days)</p>
                        </div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={250}>
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
                                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}
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
                    </div>

                    {/* Monthly Comparison */}
                    <div className="card chart-container">
                        <div className="card-header">
                            <div className="header-with-icon">
                                <Target size={20} className="text-secondary" />
                                <h2>Monthly Performance</h2>
                            </div>
                            <p className="subtitle">Income vs Expenses vs Plan</p>
                        </div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={comparisonData} margin={{ top: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Budget Health (Condensed) and Category Heatmap */}
                    <div className="card chart-container">
                        <div className="card-header">
                            <div className="header-with-icon">
                                <Flame size={20} className="text-accent" />
                                <h2>Burn Rate</h2>
                            </div>
                            <p className="subtitle">Are you sticking to the plan?</p>
                        </div>

                        <div className="health-stats condensed">
                            <div className="health-item">
                                <div className="health-label-row">
                                    <span className="health-name">Monthly Budget</span>
                                    <span className="health-percent">{budgetUsagePercent.toFixed(0)}%</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div className={`progress-bar-fill ${budgetUsagePercent > 90 ? 'danger' : budgetUsagePercent > 70 ? 'warning' : ''}`}
                                        style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}></div>
                                </div>
                            </div>

                            <div className="health-item">
                                <div className="health-label-row">
                                    <span className="health-name">Weekly Allowance</span>
                                    <span className="health-percent">{weeklyUsagePercent.toFixed(0)}%</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div className={`progress-bar-fill ${weeklyUsagePercent > 100 ? 'danger' : ''}`}
                                        style={{ width: `${Math.min(weeklyUsagePercent, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="category-heatmap-mini">
                            <div className="header-with-icon mini-header">
                                <PieIcon size={16} className="text-secondary" />
                                <h3>Top Spending</h3>
                            </div>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={150}>
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
                    </div>

                    {/* Savings Goals */}
                    <div className="card chart-container">
                        <div className="card-header">
                            <div className="header-with-icon">
                                <Trophy size={20} style={{ color: '#fbbf24' }} />
                                <h2>Savings Goals</h2>
                            </div>
                            <p className="subtitle">Progress on your long-term targets</p>
                        </div>

                        <div className="goals-list-dashboard">
                            {goals.length === 0 ? (
                                <div className="empty-goals-mini">
                                    <p>No active goals.</p>
                                    <span className="hint">Add some in the Planning tab!</span>
                                </div>
                            ) : (
                                goals.map(goal => {
                                    // Smart Link: If tracking is 'auto', use account balance. If 'manual', use stored allocated amount.
                                    const linkedAccount = goal.accountId ? accounts.find(a => a.id === goal.accountId) : null;
                                    const isAuto = goal.trackingType === 'auto';
                                    const currentAmt = (isAuto && linkedAccount) ? linkedAccount.balance : goal.currentAmount;
                                    const percent = (currentAmt / goal.targetAmount) * 100;

                                    return (
                                        <div key={goal.id} className="goal-item-mini">
                                            <div className="goal-info-mini">
                                                <div className="goal-title-linked">
                                                    <span className="goal-name-mini">{goal.name}</span>
                                                    {linkedAccount && (
                                                        <span className="link-indicator">
                                                            <Link2 size={10} />
                                                            {linkedAccount.name} {isAuto ? '(Auto)' : '(Allocated)'}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="goal-amount-mini">₱ {currentAmt.toLocaleString()} / ₱ {goal.targetAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="goal-progress-mini">
                                                <div className="progress-bar-bg small">
                                                    <div className="progress-bar-fill goal" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                                </div>
                                                <span className="goal-percent-mini">{percent.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
