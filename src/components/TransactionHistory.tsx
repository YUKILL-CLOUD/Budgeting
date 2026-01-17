import React, { useEffect, useState } from 'react';
import { useTransactionStore } from '../stores/transactionStore';
import { useAccountStore } from '../stores/accountStore';
import { useCategoryStore } from '../stores/categoryStore';
import { format, isToday, isYesterday } from 'date-fns';
import { ShoppingCart, Utensils, Home, Car, Heart, Zap, Gift, Briefcase, PlusCircle, ArrowRightLeft, Search, Filter, Tag, Edit2, Trash2 } from 'lucide-react';
import type { Transaction } from '../lib/db';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
        <div className="space-y-4">
            {!limit && (
                <div className="flex items-center gap-3 p-1">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search records..."
                            className="pl-9 bg-slate-800 border-white/10 text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {onManageCategories && (
                        <Button variant="outline" size="sm" onClick={onManageCategories} className="border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white">
                            <Tag className="mr-2 h-4 w-4" />
                            Categories
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                    </Button>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8 text-slate-400">Loading transactions...</div>
            ) : sortedDates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Zap className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium text-white">No transactions found</p>
                    <span className="text-sm">Add some to see your history!</span>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date} className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-400 px-1">{getDateLabel(date)}</h3>
                            <div className="space-y-2">
                                {groupedTransactions[date].map(t => {
                                    const category = getCategory(t.categoryId);
                                    const Icon = category ? (iconMap[category.icon] || ShoppingCart) : ArrowRightLeft;
                                    const accountName = getAccountName(t.accountId);
                                    const toAccountName = t.transferToAccountId ? getAccountName(t.transferToAccountId) : null;
                                    const isIncome = t.type === 'income';
                                    const isTransfer = t.type === 'transfer';

                                    return (
                                        <div key={t.id} className="group flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 transition-colors">
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/50 border border-white/5"
                                                style={{ color: category?.color || '#94a3b8' }}
                                            >
                                                <Icon size={18} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="font-medium text-white truncate pr-2">
                                                        {isTransfer ? `Transfer: ${accountName} → ${toAccountName}` : category?.name || 'Uncategorized'}
                                                    </span>
                                                    <span className={cn(
                                                        "font-semibold whitespace-nowrap",
                                                        isIncome ? "text-emerald-400" : isTransfer ? "text-slate-200" : "text-white"
                                                    )}>
                                                        {isIncome ? '+' : '-'} ₱{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-slate-400">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <span>{isTransfer ? 'Transfer' : accountName}</span>
                                                        {t.note && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="truncate">{t.note}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {!limit && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {onEditTransaction && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10" onClick={() => onEditTransaction(t)}>
                                                            <Edit2 size={14} />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10"
                                                        onClick={() => t.id && confirm('Delete this transaction?') && deleteTransaction(t.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
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
