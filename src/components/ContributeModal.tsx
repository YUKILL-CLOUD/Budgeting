import React, { useState } from 'react';
import { X, DollarSign, ArrowRight } from 'lucide-react';

interface ContributeModalProps {
    goalName: string;
    onClose: () => void;
    onSumit: (amount: number) => void;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({ goalName, onClose, onSumit }) => {
    const [amount, setAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (!isNaN(val) && val > 0) {
            onSumit(val);
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
                        <label>Contribution Amount</label>
                        <div className="input-wrapper large">
                            <span className="currency-symbol">₱</span>
                            <input
                                type="number"
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-actions full-width">
                        <button type="submit" className="btn-modal-submit primary-gold">
                            <span>Confirm Contribution</span>
                            <DollarSign size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
