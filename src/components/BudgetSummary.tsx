import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Wallet } from 'lucide-react';
import { useTransactionStore } from '../stores/transactionStore';
import { useGoalStore } from '../stores/goalStore';
import { useObligationStore } from '../stores/obligationStore';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const BudgetSummary: React.FC = () => {
    const { transactions } = useTransactionStore();
    const { goals } = useGoalStore();
    const { obligations } = useObligationStore();

    // Calculate metrics
    const { totalIncome, totalPlannedExpenses, totalSavings } = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Actual Income for the current month
        const income = transactions
            .filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
            .reduce((sum, t) => sum + t.amount, 0);

        // Planned Expenses (Bills + Monthly Savings Plans)
        const goalMonthlyTotal = goals.reduce((sum, g) => sum + (g.monthlyPlan || 0), 0);
        const obligationTotal = obligations.reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalPlanned = goalMonthlyTotal + obligationTotal;

        // "Savings Targets" in this context should probably show the Monthly Planned Savings 
        // to avoid overwhelming with the total 230k target.
        const monthlySavingsTargets = goalMonthlyTotal;

        return { totalIncome: income, totalPlannedExpenses: totalPlanned, totalSavings: monthlySavingsTargets };
    }, [transactions, goals, obligations]);

    const remainingBalance = totalIncome - totalPlannedExpenses;
    const isZeroBased = Math.abs(remainingBalance) < 1;

    return (
        <div className="card summary-card">
            <div className="card-header centered">
                <h2>Financial Blueprint</h2>
                <p className="subtitle">Current Month Overview</p>
            </div>

            <div className="summary-grid">
                <div className="summary-item income">
                    <div className="icon-badge income-bg"><TrendingUp size={20} /></div>
                    <div className="summary-details">
                        <span className="label">Actual Income</span>
                        <span className="value">₱ {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="summary-item expense">
                    <div className="icon-badge expense-bg"><TrendingDown size={20} /></div>
                    <div className="summary-details">
                        <span className="label">Planned Expenses</span>
                        <span className="value">₱ {totalPlannedExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="summary-item savings">
                    <div className="icon-badge savings-bg"><Target size={20} /></div>
                    <div className="summary-details">
                        <span className="label">Planned Savings</span>
                        <span className="value">₱ {totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className={`balance-section ${isZeroBased ? 'balanced' : remainingBalance > 0 ? 'surplus' : 'deficit'}`}>
                <div className="balance-header">
                    <Wallet size={24} />
                    <h3>Net Flow</h3>
                </div>
                <div className="balance-amount">
                    ₱ {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="balance-status">
                    {isZeroBased
                        ? "Perfectly balanced."
                        : remainingBalance > 0
                            ? "Surplus available for savings or goals."
                            : "Deficit based on Planned Expenses."}
                </div>
            </div>
        </div>
    );
};
