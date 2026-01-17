import React from 'react';
import { CalendarClock, ShoppingBag } from 'lucide-react';
import { useGoalStore } from '../stores/goalStore';
import { useObligationStore } from '../stores/obligationStore';
import { Card, CardContent } from "@/components/ui/card";

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <CalendarClock className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Spending Allowances</h2>
                        <p className="text-sm text-slate-400">Weekly breakdown of your monthly blueprints</p>
                    </div>
                </div>

                {/* Total Badge */}
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-xl px-6 py-3 flex flex-col items-center md:items-end">
                    <span className="text-xs font-bold text-amber-500/80 uppercase tracking-wider mb-1">Total Weekly Need</span>
                    <span className="text-2xl font-black text-amber-400">₱ {totalWeeklyAllowance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
            </div>

            {/* Planner Card */}
            <Card className="bg-[#1e293b] border-white/5">
                <CardContent className="p-6">
                    {allPlannedItems.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarClock className="mx-auto mb-4 text-slate-600" size={48} />
                            <p className="text-slate-500 italic">No monthly plans or obligations set.</p>
                            <p className="text-sm text-slate-600 mt-2">Add goals or obligations to see your weekly breakdown.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allPlannedItems.map(item => {
                                const weeklyAmount = item.monthlyAmount / 4.33;

                                return (
                                    <div key={item.id} className="group flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:bg-slate-800 hover:border-white/10 transition-all">
                                        <div className="p-3 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                            <ShoppingBag className="text-indigo-400" size={20} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white mb-1 truncate">{item.name}</h3>
                                            <p className="text-xs text-slate-500">
                                                (₱{item.monthlyAmount.toLocaleString()} ÷ 4.33 weeks)
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">
                                                ₱ {weeklyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium">/ week</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
