import React, { useState } from 'react';
import { X, Plus, Minus, RefreshCw } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import type { Account } from '../lib/db';
import { toast } from 'sonner';

interface EditAccountModalProps {
    account: Account;
    onClose: () => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({ account, onClose }) => {
    const { updateAccount } = useAccountStore();
    const [amount, setAmount] = useState('');
    const [name, setName] = useState(account.name);
    const [mode, setMode] = useState<'add' | 'remove' | 'update'>('update');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!account.id) return;

        const value = parseFloat(amount) || 0;
        let newBalance = account.balance;

        if (mode === 'add') {
            newBalance = account.balance + value;
            toast.success(`Added ₱${value.toLocaleString()} to ${name}`);
        } else if (mode === 'remove') {
            newBalance = account.balance - value;
            toast.success(`Removed ₱${value.toLocaleString()} from ${name}`);
        } else {
            newBalance = value;
            toast.success(`Updated ${name} balance to ₱${value.toLocaleString()}`);
        }

        await updateAccount(account.id, {
            name,
            balance: newBalance,
        });

        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Account</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            className="styled-input"
                            style={{ paddingLeft: '1rem' }}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Account name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Current Balance</label>
                        <div className="balance-display-input">
                            ₱ {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Action</label>
                        <div className="mode-selector">
                            <button
                                type="button"
                                className={`mode-btn ${mode === 'add' ? 'active' : ''}`}
                                onClick={() => setMode('add')}
                            >
                                <Plus size={20} />
                                <span>Add</span>
                            </button>
                            <button
                                type="button"
                                className={`mode-btn ${mode === 'remove' ? 'active' : ''}`}
                                onClick={() => setMode('remove')}
                            >
                                <Minus size={20} />
                                <span>Remove</span>
                            </button>
                            <button
                                type="button"
                                className={`mode-btn ${mode === 'update' ? 'active' : ''}`}
                                onClick={() => setMode('update')}
                            >
                                <RefreshCw size={20} />
                                <span>Update</span>
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            {mode === 'add' && 'Amount to Add'}
                            {mode === 'remove' && 'Amount to Remove'}
                            {mode === 'update' && 'Exact Balance'}
                        </label>
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
                        {(mode === 'add' || mode === 'remove') && (
                            <div className="help-text-preview">
                                New balance will be:{' '}
                                <span className="preview-value">
                                    ₱ {(account.balance + (mode === 'add' ? 1 : -1) * (parseFloat(amount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}
                        {mode === 'update' && (
                            <p className="help-text-preview">This will manually override the balance.</p>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-modal-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-modal-submit">
                            {mode === 'add' ? 'Confirm Addition' : mode === 'remove' ? 'Confirm Removal' : 'Update Balance'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
