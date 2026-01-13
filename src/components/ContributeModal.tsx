import React, { useState } from 'react';
import { X, Wallet, ArrowRightLeft } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';

interface ContributeModalProps {
    goalName: string;
    defaultToAccountId?: number;
    onClose: () => void;
    onSumit: (amount: number, fromAccountId: number, toAccountId?: number) => void;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({ goalName, defaultToAccountId, onClose, onSumit }) => {
    const { accounts } = useAccountStore();
    const [amount, setAmount] = useState('');
    const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id?.toString() || '');
    const [toAccountId, setToAccountId] = useState<string>(defaultToAccountId?.toString() || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        const fromId = parseInt(fromAccountId);
        const toId = toAccountId ? parseInt(toAccountId) : undefined;

        if (!isNaN(val) && val > 0 && fromId) {
            try {
                setIsSaving(true);
                await onSumit(val, fromId, toId);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content mini-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-with-subtitle">
                        <h2>Add Funds</h2>
                        <p className="subtitle">Allocating to: {goalName}</p>
                    </div>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="contribute-form">
                    <div className="form-group">
                        <label className="field-label caps">Contribution Amount</label>
                        <div className="input-wrapper">
                            <span className="currency-symbol-prefix">₱</span>
                            <input
                                type="number"
                                className="styled-input large-input"
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="field-label caps">Deduct From</label>
                        <div className="input-wrapper">
                            <Wallet size={18} className="input-icon-left" />
                            <select
                                value={fromAccountId}
                                onChange={e => setFromAccountId(e.target.value)}
                                className="styled-input"
                                required
                            >
                                <option value="">Select Source Account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} (₱{acc.balance.toLocaleString()})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="field-label caps">Target Account (Optional)</label>
                        <div className="input-wrapper">
                            <ArrowRightLeft size={18} className="input-icon-left" />
                            <select
                                value={toAccountId}
                                onChange={e => setToAccountId(e.target.value)}
                                className="styled-input"
                            >
                                <option value="">No Bank Transfer</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="modal-actions-single">
                        <button type="submit" className={`btn-modal-submit-gold ${isSaving ? 'btn-loading' : ''}`} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <div className="spinner" />
                                    <span>Allocating...</span>
                                </>
                            ) : (
                                'Confirm Contribution'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
