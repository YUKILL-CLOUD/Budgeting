import React, { useState } from 'react';
import { X, Building2, Wallet, PiggyBank, Banknote, CreditCard } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import { toast } from 'sonner';

interface AddAccountModalProps {
    onClose: () => void;
}

const accountIcons = [
    { name: 'Building2', icon: Building2 },
    { name: 'Wallet', icon: Wallet },
    { name: 'PiggyBank', icon: PiggyBank },
    { name: 'Banknote', icon: Banknote },
    { name: 'CreditCard', icon: CreditCard },
];

const accountColors = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#0ea5e9', // Sky
    '#f97316', // Orange
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ onClose }) => {
    const { addAccount } = useAccountStore();
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [type, setType] = useState<'bank' | 'cash' | 'credit' | 'savings'>('bank');
    const [selectedIcon, setSelectedIcon] = useState('Building2');
    const [selectedColor, setSelectedColor] = useState(accountColors[0]);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Please enter an account name');
            return;
        }

        try {
            setIsSaving(true);
            await addAccount({
                name: name.trim(),
                balance: parseFloat(balance) || 0,
                type,
                color: selectedColor,
                icon: selectedIcon,
            });
            toast.success(`Account "${name}" created successfully!`);
            onClose();
        } catch (error) {
            toast.error('Failed to create account');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-with-subtitle">
                        <h2>New Account</h2>
                        <p className="subtitle">Track a new financial source</p>
                    </div>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="contribute-form">
                    <div className="form-group">
                        <label className="field-label caps">Account Name</label>
                        <input
                            type="text"
                            className="styled-input"
                            style={{ paddingLeft: '1rem' }}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. BPI Savings, Pocket Cash"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="field-label caps">Initial Balance</label>
                            <div className="input-wrapper">
                                <span className="currency-symbol-prefix">₱</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="styled-input"
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="field-label caps">Account Type</label>
                            <select
                                className="styled-input"
                                style={{ paddingLeft: '1rem' }}
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                            >
                                <option value="bank">Bank Account</option>
                                <option value="savings">Savings Goal / Pot</option>
                                <option value="cash">Physical Cash</option>
                                <option value="credit">Credit Card / Debt</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="field-label caps">Icon & Aesthetic</label>
                        <div className="color-grid" style={{ marginBottom: '1rem' }}>
                            {accountColors.map((color) => (
                                <div
                                    key={color}
                                    className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setSelectedColor(color)}
                                />
                            ))}
                        </div>
                        <div className="mode-selector">
                            {accountIcons.map(({ name: iconName, icon: Icon }) => (
                                <button
                                    key={iconName}
                                    type="button"
                                    className={`mode-btn ${selectedIcon === iconName ? 'active' : ''}`}
                                    onClick={() => setSelectedIcon(iconName)}
                                >
                                    <Icon size={20} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '1rem' }}>
                        <button type="button" className="btn-modal-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={`btn-modal-submit ${isSaving ? 'btn-loading' : ''}`} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <div className="spinner" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
