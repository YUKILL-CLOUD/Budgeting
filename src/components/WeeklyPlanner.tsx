import React from 'react';
import { CalendarClock, ShoppingBag } from 'lucide-react';
import { useGoalStore } from '../stores/goalStore';

export const WeeklyPlanner: React.FC = () => {
    const { goals } = useGoalStore();

    // In the new system, we treat Goals with a 'monthlyPlan' as items to fund.
    // This includes both Bills (Fixed) and Savings/Flexible Spending (if planned).
    // Let's filter for anything with a positive monthly plan.
    const plannedItems = goals.filter(g => (g.monthlyPlan || 0) > 0);

    const totalWeeklyAllowance = plannedItems.reduce((acc, item) => {
        return acc + (item.monthlyPlan / 4.33);
    }, 0);

    return (
        <div className="card planner-card">
            <div className="card-header highlight-header">
                <CalendarClock size={24} />
                <div>
                    <h2>Spending Allowances</h2>
                    <p className="subtitle-white">Weekly breakdown of your monthly blueprints</p>
                </div>
                <div className="total-allowance">
                    <span className="allowance-label">Total Weekly Need</span>
                    <span className="allowance-value">₱ {totalWeeklyAllowance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
            </div>

            <div className="planner-list">
                {plannedItems.length === 0 ? (
                    <p className="empty-planner">No monthly plans set in your Goals.</p>
                ) : (
                    plannedItems.map(item => {
                        const weeklyAmount = item.monthlyPlan / 4.33;

                        return (
                            <div key={item.id} className="planner-item">
                                <div className="planner-icon">
                                    <ShoppingBag size={18} />
                                </div>
                                <div className="planner-details">
                                    <span className="planner-name">{item.name}</span>
                                    <span className="planner-calc">
                                        (₱{item.monthlyPlan} / 4.33)
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
