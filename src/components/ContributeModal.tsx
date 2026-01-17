import React, { useState } from 'react';
import { Wallet, ArrowRightLeft } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#1e293b] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Add Funds</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Allocating to: <span className="text-white font-medium">{goalName}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-slate-300">Contribution Amount</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₱</span>
                            <Input
                                id="amount"
                                type="number"
                                className="pl-7 bg-slate-800 border-white/10 text-white text-lg font-medium h-12"
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fromAccount" className="flex items-center gap-1.5 text-slate-300">
                            <Wallet size={14} /> Deduct From
                        </Label>
                        <select
                            id="fromAccount"
                            value={fromAccountId}
                            onChange={e => setFromAccountId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-white"
                            required
                        >
                            <option value="">Select Source Account</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} (₱{acc.balance.toLocaleString()})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="toAccount" className="flex items-center gap-1.5 text-slate-300">
                            <ArrowRightLeft size={14} /> Target Account (Optional)
                        </Label>
                        <select
                            id="toAccount"
                            value={toAccountId}
                            onChange={e => setToAccountId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-white"
                        >
                            <option value="">No Bank Transfer</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                            {isSaving ? 'Allocating...' : 'Confirm Contribution'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
