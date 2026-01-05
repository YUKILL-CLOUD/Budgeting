import React, { useEffect, useState } from 'react';
import { useAccountStore } from '../stores/accountStore';
import { Building2, Wallet as WalletIcon, PiggyBank, Banknote, TrendingUp, Plus, Edit, CreditCard } from 'lucide-react';
import { EditAccountModal } from './EditAccountModal';
import { AddAccountModal } from './AddAccountModal';
import type { Account } from '../lib/db';

const iconMap: Record<string, React.ElementType> = {
    Building2,
    Wallet: WalletIcon,
    PiggyBank,
    Banknote,
    CreditCard,
};

export const AccountDashboard: React.FC = () => {
    const { accounts, loading, fetchAccounts, getTotalBalance } = useAccountStore();
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [showAddAccount, setShowAddAccount] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const totalBalance = getTotalBalance();

    if (loading) {
        return <div className="loading">Loading accounts...</div>;
    }

    return (
        <div className="bento-dashboard">
            <div className="bento-grid">
                {/* Total Balance Card (Large Bento Piece) */}
                <div className="bento-item total-balance-card">
                    <div className="balance-header">
                        <TrendingUp size={24} />
                        <span className="balance-label">Total Balance</span>
                    </div>
                    <div className="balance-amount">
                        ₱ {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="balance-subtitle">Across all accounts</div>
                </div>

                {accounts.map((account, index) => {
                    const Icon = iconMap[account.icon] || WalletIcon;

                    // Row 1 & 2 side pieces (Index 0, 1)
                    // Bottom row pieces (Index 2, 3)
                    let bentoClass = 'bento-standard';
                    if (index < 2) bentoClass = 'bento-side';
                    if (index >= 2) bentoClass = 'bento-bottom';

                    return (
                        <div
                            key={account.id}
                            className={`bento-item account-card ${bentoClass}`}
                            style={{ borderTopColor: account.color }}
                        >
                            <div className="account-header">
                                <div className="account-icon-box" style={{ backgroundColor: `${account.color}20` }}>
                                    <Icon size={20} style={{ color: account.color }} />
                                </div>
                                <div className="account-info">
                                    <span className="account-name">{account.name}</span>
                                    <span className="account-type">{account.type}</span>
                                </div>
                            </div>

                            <div className="account-balance">
                                ₱ {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>

                            <div className="account-actions">
                                <button
                                    className="btn-account-action"
                                    onClick={() => setEditingAccount(account)}
                                >
                                    <Edit size={14} />
                                    Manage
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Add Account Card (Smallest Bento Piece) */}
                <div
                    className="bento-item account-card add-account-card bento-standard"
                    onClick={() => setShowAddAccount(true)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="add-account-content">
                        <Plus size={32} />
                        <span>New Account</span>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingAccount && (
                <EditAccountModal
                    account={editingAccount}
                    onClose={() => setEditingAccount(null)}
                />
            )}

            {/* Add Modal */}
            {showAddAccount && (
                <AddAccountModal
                    onClose={() => setShowAddAccount(false)}
                />
            )}
        </div>
    );
};
