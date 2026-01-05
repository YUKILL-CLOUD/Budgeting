import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Expense } from '../types';

interface BudgetChartProps {
    expenses: Expense[];
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ expenses }) => {
    // Process data for the chart
    const data = expenses.map(exp => {
        let monthlyAmount = exp.amount;
        if (exp.frequency === 'Weekly') {
            monthlyAmount = exp.amount * 4.33;
        } else if (exp.frequency === 'Annual') {
            monthlyAmount = exp.amount / 12;
        }
        return {
            name: exp.name,
            value: Math.round(monthlyAmount)
        };
    }).filter(d => d.value > 0);

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
                <p className="subtitle">Breakdown of planned monthly spending</p>
            </div>
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
        </div>
    );
};
