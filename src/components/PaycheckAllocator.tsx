import React, { useState } from 'react';
import { PiggyBank, Wallet, Receipt, CheckCircle2, X } from 'lucide-react';
import { useGoalStore } from '../stores/goalStore';

interface PaycheckAllocatorProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const PaycheckAllocator: React.FC<PaycheckAllocatorProps> = ({ isOpen, onClose }) => {
    const { goals } = useGoalStore();
    const [actualIncome, setActualIncome] = useState<number>(0);
    const [spendingAllowance, setSpendingAllowance] = useState<number>(2000); // Default allowance

    // 1. BLUEPRINT-ONLY LOGIC
    const unifiedItems: {
        id: string,
        name: string,
        weeklyMin: number,
        monthlyTarget: number,
        priority: 'high' | 'medium' | 'low',
        type: 'fixed' | 'saving'
    }[] = [];

    goals.forEach(goal => {
        const monthlyPlan = goal.monthlyPlan || 0;
        const totalTarget = goal.targetAmount || 0;
        const fullMonthNeed = Math.max(monthlyPlan, totalTarget);
        const weeklyPortion = fullMonthNeed / 4.33;

        const rawPrio = (goal.priority || 'medium').toLowerCase();
        const prio = (['high', 'medium', 'low'].includes(rawPrio) ? rawPrio : 'medium') as 'high' | 'medium' | 'low';

        // High priority = Bills/Loans
        const type = (goal.refreshType === 'monthly' || prio === 'high') ? 'fixed' : 'saving';

        unifiedItems.push({
            id: `goal-${goal.id || Math.random()}`,
            name: goal.name,
            weeklyMin: weeklyPortion,
            monthlyTarget: fullMonthNeed,
            priority: prio,
            type
        });
    });

    // 2. ULTIMATE BALANCED WATERFALL
    let pool = actualIncome - spendingAllowance;
    const suggestions: Record<string, number> = {};
    unifiedItems.forEach(i => suggestions[i.id] = 0);

    // --- PASS 1: SURVIVAL WATERFALL (High Priority Only) ---
    unifiedItems.filter(item => item.priority === 'high').forEach(item => {
        if (pool > 0 && item.weeklyMin > 0) {
            const amountToGive = Math.min(pool, item.weeklyMin);
            suggestions[item.id] = amountToGive;
            pool -= amountToGive;
        }
    });

    // --- PASS 2: BALANCED GROWTH SPLIT (All Priorities) ---
    let activeGoals = unifiedItems.filter(item => (item.monthlyTarget - (suggestions[item.id] || 0)) > 0.5);

    while (pool > 0.5 && activeGoals.length > 0) {
        const share = pool / activeGoals.length;
        let poolConsumedThisRound = 0;

        activeGoals.forEach(item => {
            const currentAmount = suggestions[item.id] || 0;
            const stillNeeded = item.monthlyTarget - currentAmount;
            const amountToApply = Math.min(share, stillNeeded);
            suggestions[item.id] = currentAmount + amountToApply;
            poolConsumedThisRound += amountToApply;
        });

        pool -= poolConsumedThisRound;
        activeGoals = activeGoals.filter(item => (item.monthlyTarget - (suggestions[item.id] || 0)) > 0.5);

        if (poolConsumedThisRound < 0.1) break;
    }

    // 3. FINAL CALCULATIONS
    const finalSurplus = pool > 0 ? pool : 0;
    const totalPocketMoney = spendingAllowance + finalSurplus;
    const shortfall = pool < 0 ? Math.abs(pool) : 0;

    const fixedObligations = unifiedItems.filter(i => i.type === 'fixed');
    const savingsTargets = unifiedItems.filter(i => i.type === 'saving');

    const content = (
        <div className="allocator-container">
            {!isOpen && (
                <div className="tab-page-header">
                    <div className="header-with-icon">
                        <div className="header-icon-pill">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h2 className="page-title">Paycheck Worksheet</h2>
                            <p className="page-subtitle">Blueprint-driven allocation for this week's income</p>
                        </div>
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="modal-header">
                    <div className="header-with-icon">
                        <Wallet size={24} />
                        <h2>Paycheck Worksheet</h2>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X size={24} />
                    </button>
                </div>
            )}

            <div className="allocator-input-section waterfall-inputs">
                <div className="input-row-main">
                    <div className="input-group-main full-width">
                        <label className="field-label white-text">Actual Weekly Income</label>
                        <div className="input-wrapper massive">
                            <span className="currency-symbol">₱</span>
                            <input
                                type="number"
                                value={actualIncome || ''}
                                onChange={(e) => setActualIncome(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="input-row-sub">
                    <div className="input-group-sub">
                        <label className="field-label gold-text">Pocket Spending Allowance</label>
                        <div className="input-wrapper gold-border small-input">
                            <span className="currency-symbol">₱</span>
                            <input
                                type="number"
                                value={spendingAllowance || ''}
                                onChange={(e) => setSpendingAllowance(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`bank-allocation-grid ${isOpen ? 'modal-grid' : 'multi-card-layout'}`}>
                {/* 💳 Card 1: Bills & Loans */}
                <div className="bank-card bills-card">
                    <div className="bank-header">
                        <Receipt size={18} className="icon-bills" />
                        <span>Bills & Loans</span>
                    </div>
                    <div className="bank-purpose">Monthly Obligations</div>
                    <div className="allocation-list mini-list">
                        {fixedObligations.map(item => (
                            <div key={item.id} className={`allocation-item-grid prio-${item.priority}`}>
                                <div className="item-name-group">
                                    <span className="item-name-text" title={item.name}>{item.name}</span>
                                    <span className="alloc-prio-tag">{item.priority}</span>
                                </div>
                                <div className="item-values-group">
                                    <span className="val-suggested">₱ {Math.round(suggestions[item.id]).toLocaleString()}</span>
                                    <span className="val-divider">/</span>
                                    <span className="val-required">₱ {Math.round(item.monthlyTarget).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🎯 Card 2: Savings Goals */}
                <div className="bank-card savings-card">
                    <div className="bank-header">
                        <PiggyBank size={18} className="icon-savings" />
                        <span>Savings Goals</span>
                    </div>
                    <div className="bank-purpose">Balanced Shared Growth</div>
                    <div className="allocation-list mini-list">
                        {savingsTargets.map(item => (
                            <div key={item.id} className={`allocation-item-grid prio-${item.priority}`}>
                                <div className="item-name-group">
                                    <span className="item-name-text" title={item.name}>{item.name}</span>
                                    <span className="alloc-prio-tag">{item.priority}</span>
                                </div>
                                <div className="item-values-group">
                                    <span className="val-suggested">₱ {Math.round(suggestions[item.id]).toLocaleString()}</span>
                                    <span className="val-divider">/</span>
                                    <span className="val-required">₱ {Math.round(item.monthlyTarget).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🛍️ Card 3: Spending Summary */}
                <div className="bank-card bpi-card">
                    <div className="bank-header">
                        <Wallet size={18} className="icon-spending" />
                        <span>Spending Cash</span>
                    </div>

                    <div className="waterfall-breakdown">
                        <div className="wf-row">
                            <span>Base Allowance:</span>
                            <span>₱ {Math.round(spendingAllowance).toLocaleString()}</span>
                        </div>
                        <div className="wf-row">
                            <span>Income Surplus:</span>
                            <span className="success-text">+ ₱ {Math.round(finalSurplus).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="balance-display small-pad border-top">
                        <span className="balance-label">Total Pocket Money</span>
                        <span className={`balance-amount ${shortfall > 0 ? 'warning' : ''}`}>
                            ₱ {Math.round(totalPocketMoney).toLocaleString()}
                        </span>
                    </div>

                    <div className="transfer-checklist">
                        <p className="checklist-title">Weekly Checklist:</p>
                        {unifiedItems.filter(i => suggestions[i.id] > 0.5).map(item => (
                            <div key={`check-${item.id}`} className="check-item">
                                <CheckCircle2 size={14} className="check-icon" />
                                <span style={{ fontSize: '0.8rem' }}>Move ₱{Math.round(suggestions[item.id]).toLocaleString()} to <strong>{item.name}</strong></span>
                            </div>
                        ))}
                        <div className="check-item highlight">
                            <CheckCircle2 size={14} className="check-icon" />
                            <span style={{ fontSize: '0.8rem' }}>Keep ₱{Math.round(totalPocketMoney).toLocaleString()} for <strong>Daily Spending</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isOpen) {
        return (
            <div className="modal-overlay">
                <div className="modal-content large">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};
