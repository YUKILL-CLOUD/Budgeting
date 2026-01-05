import React, { useState } from 'react';
import { X, Plus, Minus, ArrowRightLeft, Calendar, Tag, Wallet, MessageSquare } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { toast } from 'sonner';
import type { Transaction } from '../lib/db';

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

    const filteredCategories = categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !accountId || (type !== 'transfer' && !categoryId)) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
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
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Type Selector */}
                    <div className="form-group">
                        <label>Type</label>
                        <div className="mode-selector">
                            <button
                                type="button"
                                className={`mode-btn ${type === 'expense' ? 'active' : ''}`}
                                onClick={() => setType('expense')}
                            >
                                <Minus size={20} />
                                <span>Expense</span>
                            </button>
                            <button
                                type="button"
                                className={`mode-btn ${type === 'income' ? 'active' : ''}`}
                                onClick={() => setType('income')}
                            >
                                <Plus size={20} />
                                <span>Income</span>
                            </button>
                            <button
                                type="button"
                                className={`mode-btn ${type === 'transfer' ? 'active' : ''}`}
                                onClick={() => setType('transfer')}
                            >
                                <ArrowRightLeft size={20} />
                                <span>Transfer</span>
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Amount</label>
                        <div className="input-wrapper">
                            <span className="currency-symbol-prefix">₱</span>
                            <input
                                type="number"
                                step="0.01"
                                className="styled-input"
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label>
                                <div className="label-with-icon">
                                    <Wallet size={16} />
                                    <span>Account</span>
                                </div>
                            </label>
                            <select
                                className="styled-input"
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
                            <div className="form-group">
                                <label>
                                    <div className="label-with-icon">
                                        <ArrowRightLeft size={16} />
                                        <span>To Account</span>
                                    </div>
                                </label>
                                <select
                                    className="styled-input"
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
                            <div className="form-group">
                                <label>
                                    <div className="label-with-icon">
                                        <Tag size={16} />
                                        <span>Category</span>
                                    </div>
                                </label>
                                <select
                                    className="styled-input"
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

                    <div className="form-group">
                        <label>
                            <div className="label-with-icon">
                                <Calendar size={16} />
                                <span>Date</span>
                            </div>
                        </label>
                        <input
                            type="date"
                            className="styled-input"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <div className="label-with-icon">
                                <MessageSquare size={16} />
                                <span>Note</span>
                            </div>
                        </label>
                        <input
                            type="text"
                            className="styled-input"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="What was this for?"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-modal-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-modal-submit">
                            {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
