import React from 'react';
import { CalendarClock, ShoppingBag } from 'lucide-react';
import { useGoalStore } from '../stores/goalStore';
import { useObligationStore } from '../stores/obligationStore';

export const WeeklyPlanner: React.FC = () => {
    const { goals } = useGoalStore();
    const { obligations } = useObligationStore();

    // Combine both Goals and Obligations for the weekly breakdown
    const plannedGoals = goals.filter(g => (g.monthlyPlan || 0) > 0).map(g => ({
        id: `goal-${g.id}`,
        name: g.name,
        monthlyAmount: g.monthlyPlan
    }));

    const plannedObs = obligations.map(o => ({
        id: `ob-${o.id}`,
        name: o.name,
        monthlyAmount: o.amount
    }));

    const allPlannedItems = [...plannedGoals, ...plannedObs];

    const totalWeeklyAllowance = allPlannedItems.reduce((acc, item) => {
        return acc + (item.monthlyAmount / 4.33);
    }, 0);

    return (
        <div className="planner-container">
            <div className="tab-page-header">
                <div className="header-with-icon">
                    <div className="header-icon-pill">
                        <CalendarClock size={24} />
                    </div>
                    <div className="header-text-with-action">
                        <div>
                            <h2 className="page-title">Spending Allowances</h2>
                            <p className="page-subtitle">Weekly breakdown of your monthly blueprints</p>
                        </div>
                        <div className="total-allowance-badge">
                            <span className="allowance-label">Total Weekly Need:</span>
                            <span className="allowance-value">₱ {totalWeeklyAllowance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card planner-card">

                <div className="planner-list">
                    {allPlannedItems.length === 0 ? (
                        <p className="empty-planner">No monthly plans or obligations set.</p>
                    ) : (
                        allPlannedItems.map(item => {
                            const weeklyAmount = item.monthlyAmount / 4.33;

                            return (
                                <div key={item.id} className="planner-item">
                                    <div className="planner-icon">
                                        <ShoppingBag size={18} />
                                    </div>
                                    <div className="planner-details">
                                        <span className="planner-name">{item.name}</span>
                                        <span className="planner-calc">
                                            (₱{item.monthlyAmount.toLocaleString()} / 4.33)
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
        </div>
    );
};
