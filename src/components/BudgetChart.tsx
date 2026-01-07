import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTransactionStore } from '../stores/transactionStore';
import { useCategoryStore } from '../stores/categoryStore';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const BudgetChart: React.FC = () => {
    const { transactions } = useTransactionStore();
    const { categories } = useCategoryStore();

    // Process data for the chart: Real Spending
    const data = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const expenses = transactions.filter(t =>
            t.type === 'expense' &&
            isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
        );

        // Group by Category
        const group: Record<string, number> = {};
        expenses.forEach(t => {
            const catName = categories.find(c => c.id === t.categoryId)?.name || 'Uncategorized';
            group[catName] = (group[catName] || 0) + t.amount;
        });

        return Object.entries(group)
            .map(([name, value]) => ({ name, value }))
            .filter(d => d.value > 0);

    }, [transactions, categories]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{`${payload[0].name}`}</p>
                    <p className="intro">₱ {payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="card chart-card">
            <div className="card-header">
                <h2>Expense Allocation</h2>
                <p className="subtitle">Actual spending this month</p>
            </div>
            {data.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                animationBegin={0}
                                animationDuration={1500}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="empty-chart-state" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    No expense data for this month
                </div>
            )}
        </div>
    );
};
