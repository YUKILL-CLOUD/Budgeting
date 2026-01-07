import React, { useEffect, useState } from 'react';
import { useTransactionStore } from '../stores/transactionStore';
import { useAccountStore } from '../stores/accountStore';
import { useCategoryStore } from '../stores/categoryStore';
import { format, isToday, isYesterday } from 'date-fns';
import { ShoppingCart, Utensils, Home, Car, Heart, Zap, Gift, Briefcase, PlusCircle, ArrowRightLeft, Search, Filter, Tag, Edit2, Trash2 } from 'lucide-react';
import type { Transaction } from '../lib/db';

interface TransactionHistoryProps {
    onManageCategories?: () => void;
    onEditTransaction?: (transaction: Transaction) => void;
    limit?: number;
}

const iconMap: Record<string, React.ElementType> = {
    'ShoppingCart': ShoppingCart,
    'Utensils': Utensils,
    'Home': Home,
    'Car': Car,
    'Heart': Heart,
    'Zap': Zap,
    'Gift': Gift,
    'Briefcase': Briefcase,
    'PlusCircle': PlusCircle,
    'ArrowRightLeft': ArrowRightLeft,
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ onManageCategories, onEditTransaction, limit }) => {
    const { transactions, fetchTransactions, deleteTransaction, loading } = useTransactionStore();
    const { accounts } = useAccountStore();
    const { categories } = useCategoryStore();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const getAccountName = (id: number) => accounts.find(a => a.id === id)?.name || 'Unknown';
    const getCategory = (id?: number) => categories.find(c => c.id === id);

    const filteredTransactions = transactions.filter(t =>
        t.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAccountName(t.accountId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.categoryId && getCategory(t.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Group transactions by date
    const groupedTransactions: Record<string, typeof transactions> = {};
    filteredTransactions.forEach(t => {
        const dateKey = format(t.date, 'yyyy-MM-dd');
        if (!groupedTransactions[dateKey]) {
            groupedTransactions[dateKey] = [];
        }
        groupedTransactions[dateKey].push(t);
    });

    let sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

    if (limit) {
        sortedDates = sortedDates.slice(0, limit);
    }

    const getDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'EEEE, dd MMM');
    };

    return (
        <div className="transaction-history">
            {!limit && (
                <div className="history-header">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {onManageCategories && (
                        <button className="btn-filter" onClick={onManageCategories}>
                            <Tag size={18} />
                            <span>Categories</span>
                        </button>
                    )}
                    <button className="btn-filter">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                </div>
            )}

            {loading ? (
                <div className="loading">Loading transactions...</div>
            ) : sortedDates.length === 0 ? (
                <div className="empty-state">
                    <Zap size={48} />
                    <p>No transactions found</p>
                    <span>Add some to see your history!</span>
                </div>
            ) : (
                <div className="history-list">
                    {sortedDates.map(date => (
                        <div key={date} className="date-group">
                            <div className="date-label">{getDateLabel(date)}</div>
                            <div className="transactions-list">
                                {groupedTransactions[date].map(t => {
                                    const category = getCategory(t.categoryId);
                                    const Icon = category ? (iconMap[category.icon] || ShoppingCart) : ArrowRightLeft;
                                    const accountName = getAccountName(t.accountId);
                                    const toAccountName = t.transferToAccountId ? getAccountName(t.transferToAccountId) : null;

                                    return (
                                        <div key={t.id} className="transaction-item">
                                            <div className="transaction-icon" style={{ color: category?.color || '#94a3b8' }}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="transaction-info">
                                                <div className="transaction-main">
                                                    <span className="transaction-category">
                                                        {t.type === 'transfer' ? `Transfer: ${accountName} → ${toAccountName}` : category?.name || 'Uncategorized'}
                                                    </span>
                                                    <span className={`transaction-amount ${t.type}`}>
                                                        {t.type === 'income' ? '+' : '-'} ₱{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="transaction-sub">
                                                    <span className="transaction-account">{t.type === 'transfer' ? 'Transfer' : accountName}</span>
                                                    {t.note && <span className="transaction-note">• {t.note}</span>}
                                                </div>
                                            </div>
                                            {!limit && (
                                                <div className="transaction-actions">
                                                    {onEditTransaction && (
                                                        <button className="btn-icon-sm" onClick={() => onEditTransaction(t)}>
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-icon-sm delete"
                                                        onClick={() => t.id && confirm('Delete this transaction?') && deleteTransaction(t.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
