import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Wallet } from 'lucide-react';
import { useTransactionStore } from '../stores/transactionStore';
import { useGoalStore } from '../stores/goalStore';
import { useObligationStore } from '../stores/obligationStore';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Card className="bg-[#1e293b] border-white/5">
            <CardHeader className="text-center border-b border-white/5 pb-4">
                <CardTitle className="text-2xl text-white">Financial Blueprint</CardTitle>
                <CardDescription className="text-slate-400">Current Month Overview</CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Income */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                        <div className="p-3 bg-emerald-500/20 rounded-lg shrink-0">
                            <TrendingUp className="text-emerald-400" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-1">Actual Income</p>
                            <p className="text-lg font-bold text-white break-all">₱ {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20">
                        <div className="p-3 bg-rose-500/20 rounded-lg shrink-0">
                            <TrendingDown className="text-rose-400" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-rose-400/80 uppercase tracking-wider mb-1">Planned Expenses</p>
                            <p className="text-lg font-bold text-white break-all">₱ {totalPlannedExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {/* Savings */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                        <div className="p-3 bg-amber-500/20 rounded-lg shrink-0">
                            <Target className="text-amber-400" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-1">Planned Savings</p>
                            <p className="text-lg font-bold text-white break-all">₱ {totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                {/* Net Flow Section */}
                <div className={`p-6 rounded-xl border-2 ${isZeroBased
                    ? 'bg-gradient-to-br from-indigo-500/10 to-violet-600/10 border-indigo-500/30'
                    : remainingBalance > 0
                        ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/30'
                        : 'bg-gradient-to-br from-rose-500/10 to-rose-600/10 border-rose-500/30'
                    }`}>
                    <div className="flex items-center gap-3 mb-3">
                        <Wallet className={`${isZeroBased ? 'text-indigo-400' : remainingBalance > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`} size={28} />
                        <h3 className="text-lg font-bold text-white">Net Flow</h3>
                    </div>
                    <div className={`text-4xl font-black mb-2 ${isZeroBased ? 'text-indigo-400' : remainingBalance > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        ₱ {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-slate-300">
                        {isZeroBased
                            ? "✨ Perfectly balanced."
                            : remainingBalance > 0
                                ? "💰 Surplus available for savings or goals."
                                : "⚠️ Deficit based on Planned Expenses."}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
