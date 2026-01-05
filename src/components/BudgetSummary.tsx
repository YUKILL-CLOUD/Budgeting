import React from 'react';
import { TrendingUp, TrendingDown, Target, Wallet } from 'lucide-react';
import type { Income, Expense } from '../types';

interface BudgetSummaryProps {
    incomes: Income[];
    expenses: Expense[];
    savings: number;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({ incomes, expenses, savings }) => {
    // Calculations
    const totalMonthlyIncome = incomes.reduce((acc, inc) => acc + (inc.weeklyAmount * 4.33), 0);

    const totalMonthlyExpenses = expenses.reduce((acc, exp) => {
        let monthlyAmount = exp.amount;
        if (exp.frequency === 'Weekly') {
            monthlyAmount = exp.amount * 4.33;
        } else if (exp.frequency === 'Annual') {
            monthlyAmount = exp.amount / 12;
        }
        return acc + monthlyAmount;
    }, 0);

    const remainingBalance = totalMonthlyIncome - totalMonthlyExpenses - savings;
    const isZeroBased = Math.abs(remainingBalance) < 1; // Tolerance for float math

    return (
        <div className="card summary-card">
            <div className="card-header centered">
                <h2>Financial Blueprint</h2>
                <p className="subtitle">Projection system for the month</p>
            </div>

            <div className="summary-grid">
                <div className="summary-item income">
                    <div className="icon-badge income-bg"><TrendingUp size={20} /></div>
                    <div className="summary-details">
                        <span className="label">Projected Income</span>
                        <span className="value">₱ {totalMonthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="summary-item expense">
                    <div className="icon-badge expense-bg"><TrendingDown size={20} /></div>
                    <div className="summary-details">
                        <span className="label">Planned Costs</span>
                        <span className="value">₱ {totalMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="summary-item savings">
                    <div className="icon-badge savings-bg"><Target size={20} /></div>
                    <div className="summary-details">
                        <span className="label">Total Savings</span>
                        <span className="value">₱ {savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className={`balance-section ${isZeroBased ? 'balanced' : remainingBalance > 0 ? 'surplus' : 'deficit'}`}>
                <div className="balance-header">
                    <Wallet size={24} />
                    <h3>Monthly Surplus / Deficit</h3>
                </div>
                <div className="balance-amount">
                    ₱ {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="balance-status">
                    {isZeroBased
                        ? "Perfect! You have a Zero-Based Budget."
                        : remainingBalance > 0
                            ? "You have money left over. Assign it to savings or expenses."
                            : "You are over budget. Adjust your expenses."}
                </div>
            </div>
        </div>
    );
};
