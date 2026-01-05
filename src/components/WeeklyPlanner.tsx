import React from 'react';
import { CalendarClock, ShoppingBag } from 'lucide-react';
import type { Expense } from '../types';

interface WeeklyPlannerProps {
    expenses: Expense[];
}

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ expenses }) => {
    const flexibleExpenses = expenses.filter(exp => exp.isFlexible);

    // Calculate total weekly allowance for flexible items
    const totalWeeklyAllowance = flexibleExpenses.reduce((acc, exp) => {
        // If it's already weekly, use it as is.
        // If it's monthly, divide by 4.33
        // If it's annual, divide by 12 then 4.33
        let weeklyAmount = 0;
        if (exp.frequency === 'Weekly') {
            weeklyAmount = exp.amount;
        } else if (exp.frequency === 'Monthly') {
            weeklyAmount = exp.amount / 4.33;
        } else {
            weeklyAmount = (exp.amount / 12) / 4.33;
        }
        return acc + weeklyAmount;
    }, 0);

    return (
        <div className="card planner-card">
            <div className="card-header highlight-header">
                <CalendarClock size={24} />
                <div>
                    <h2>Spending Allowances</h2>
                    <p className="subtitle-white">Planned limits for daily costs</p>
                </div>
                <div className="total-allowance">
                    <span className="allowance-label">Total Weekly Limit</span>
                    <span className="allowance-value">₱ {totalWeeklyAllowance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
            </div>

            <div className="planner-list">
                {flexibleExpenses.length === 0 ? (
                    <p className="empty-planner">No flexible expenses marked yet.</p>
                ) : (
                    flexibleExpenses.map(exp => {
                        let weeklyAmount = 0;
                        if (exp.frequency === 'Weekly') {
                            weeklyAmount = exp.amount;
                        } else if (exp.frequency === 'Monthly') {
                            weeklyAmount = exp.amount / 4.33;
                        } else {
                            weeklyAmount = (exp.amount / 12) / 4.33;
                        }

                        return (
                            <div key={exp.id} className="planner-item">
                                <div className="planner-icon">
                                    <ShoppingBag size={18} />
                                </div>
                                <div className="planner-details">
                                    <span className="planner-name">{exp.name}</span>
                                    <span className="planner-calc">
                                        {exp.frequency === 'Monthly' ? `(₱${exp.amount} / 4.33)` : 'Weekly Average'}
                                    </span>
                                </div>
                                <div className="planner-amount">
                                    ₱ {weeklyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    <span className="planner-period">/ week</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
