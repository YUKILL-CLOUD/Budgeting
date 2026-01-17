import React, { useState } from 'react';
import { Building2, Wallet, PiggyBank, Banknote, CreditCard } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#1e293b] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>New Account</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Track a new financial source
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-300">Account Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. BPI Savings, Pocket Cash"
                            className="bg-slate-800 border-white/10 text-white"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="balance" className="text-slate-300">Initial Balance</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₱</span>
                                <Input
                                    id="balance"
                                    type="number"
                                    step="0.01"
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-7 bg-slate-800 border-white/10 text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-slate-300">Account Type</Label>
                            <select
                                id="type"
                                className="flex h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-white"
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

                    <div className="space-y-4">
                        <Label className="text-slate-300">Icon & Aesthetic</Label>

                        <div className="grid grid-cols-8 gap-2">
                            {accountColors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900",
                                        selectedColor === color ? "ring-2 ring-white scale-110" : "hover:scale-110"
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setSelectedColor(color)}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg overflow-x-auto">
                            {accountIcons.map(({ name: iconName, icon: Icon }) => (
                                <button
                                    key={iconName}
                                    type="button"
                                    className={cn(
                                        "p-2 rounded-md transition-all flex flex-col items-center gap-1 min-w-[60px]",
                                        selectedIcon === iconName
                                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50"
                                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                    )}
                                    onClick={() => setSelectedIcon(iconName)}
                                >
                                    <Icon size={20} />
                                    <span className="text-[10px] font-medium">{iconName}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                            {isSaving ? 'Creating...' : 'Create Account'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
