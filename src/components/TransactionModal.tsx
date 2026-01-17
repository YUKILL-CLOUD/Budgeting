import React, { useState } from 'react';
import { Plus, Minus, ArrowRightLeft, Calendar, Tag, Wallet, MessageSquare } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { toast } from 'sonner';
import type { Transaction } from '../lib/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TransactionModalProps {
    onClose: () => void;
    editingTransaction?: Transaction;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, editingTransaction }) => {
    const { accounts } = useAccountStore();
    const { categories } = useCategoryStore();
    const { addTransaction, updateTransaction } = useTransactionStore();

    const [type, setType] = useState<'income' | 'expense' | 'transfer'>(editingTransaction?.type || 'expense');
    const [amount, setAmount] = useState(editingTransaction?.amount.toString() || '');
    const [accountId, setAccountId] = useState(editingTransaction?.accountId.toString() || accounts[0]?.id?.toString() || '');
    const [transferToAccountId, setTransferToAccountId] = useState(editingTransaction?.transferToAccountId?.toString() || '');
    const [categoryId, setCategoryId] = useState(editingTransaction?.categoryId?.toString() || '');
    const [date, setDate] = useState(editingTransaction ? new Date(editingTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState(editingTransaction?.note || '');
    const [isSaving, setIsSaving] = useState(false);

    const filteredCategories = categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !accountId || (type !== 'transfer' && !categoryId)) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsSaving(true);
            const transactionData = {
                type,
                amount: parseFloat(amount),
                accountId: parseInt(accountId),
                transferToAccountId: type === 'transfer' ? parseInt(transferToAccountId) : undefined,
                categoryId: type === 'transfer' ? undefined : parseInt(categoryId),
                date: new Date(date),
                note,
            };

            if (editingTransaction?.id) {
                await updateTransaction(editingTransaction.id, transactionData);
                toast.success('Transaction updated successfully');
            } else {
                await addTransaction(transactionData);
                toast.success('Transaction added successfully');
            }

            onClose();
        } catch (error) {
            toast.error(editingTransaction ? 'Failed to update transaction' : 'Failed to add transaction');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#1e293b] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Record your income, expenses, or transfers.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Type Selector */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                type="button"
                                variant={type === 'expense' ? 'default' : 'outline'}
                                className={cn(
                                    "flex flex-col h-auto py-3 gap-1 border-white/10 hover:bg-white/5 hover:text-white",
                                    type === 'expense'
                                        ? "bg-rose-500 hover:bg-rose-600 text-white border-transparent"
                                        : "bg-slate-800 text-slate-400"
                                )}
                                onClick={() => setType('expense')}
                            >
                                <Minus size={18} />
                                <span className="text-xs">Expense</span>
                            </Button>
                            <Button
                                type="button"
                                variant={type === 'income' ? 'default' : 'outline'}
                                className={cn(
                                    "flex flex-col h-auto py-3 gap-1 border-white/10 hover:bg-white/5 hover:text-white",
                                    type === 'income'
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                                        : "bg-slate-800 text-slate-400"
                                )}
                                onClick={() => setType('income')}
                            >
                                <Plus size={18} />
                                <span className="text-xs">Income</span>
                            </Button>
                            <Button
                                type="button"
                                variant={type === 'transfer' ? 'default' : 'outline'}
                                className={cn(
                                    "flex flex-col h-auto py-3 gap-1 border-white/10 hover:bg-white/5 hover:text-white",
                                    type === 'transfer'
                                        ? "bg-blue-500 hover:bg-blue-600 text-white border-transparent"
                                        : "bg-slate-800 text-slate-400"
                                )}
                                onClick={() => setType('transfer')}
                            >
                                <ArrowRightLeft size={18} />
                                <span className="text-xs">Transfer</span>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-slate-300">Amount</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₱</span>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                className="pl-7 bg-slate-800 border-white/10 text-white"
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="account" className="flex items-center gap-1.5 text-slate-300">
                                <Wallet size={14} /> Account
                            </Label>
                            <select
                                id="account"
                                className="flex h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select Account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>

                        {type === 'transfer' ? (
                            <div className="space-y-2">
                                <Label htmlFor="toAccount" className="flex items-center gap-1.5 text-slate-300">
                                    <ArrowRightLeft size={14} /> To Account
                                </Label>
                                <select
                                    id="toAccount"
                                    className="flex h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                    value={transferToAccountId}
                                    onChange={(e) => setTransferToAccountId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select To Account</option>
                                    {accounts.filter(acc => acc.id?.toString() !== accountId).map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="category" className="flex items-center gap-1.5 text-slate-300">
                                    <Tag size={14} /> Category
                                </Label>
                                <select
                                    id="category"
                                    className="flex h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select Category</option>
                                    {filteredCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date" className="flex items-center gap-1.5 text-slate-300">
                            <Calendar size={14} /> Date
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            className="bg-slate-800 border-white/10 text-white"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note" className="flex items-center gap-1.5 text-slate-300">
                            <MessageSquare size={14} /> Note
                        </Label>
                        <Input
                            id="note"
                            type="text"
                            className="bg-slate-800 border-white/10 text-white"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="What was this for?"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className={cn(
                                "text-white min-w-[120px]",
                                type === 'expense' && "bg-rose-500 hover:bg-rose-600",
                                type === 'income' && "bg-emerald-500 hover:bg-emerald-600",
                                type === 'transfer' && "bg-blue-500 hover:bg-blue-600"
                            )}
                        >
                            {isSaving ? 'Saving...' : (editingTransaction ? 'Update' : 'Save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
