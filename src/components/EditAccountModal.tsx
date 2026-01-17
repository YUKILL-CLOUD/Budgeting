import React, { useState } from 'react';
import { Plus, Minus, RefreshCw } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import type { Account } from '../lib/db';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#1e293b] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Account</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {account.name} • Current Balance: <span className="text-white font-medium">₱{account.balance.toLocaleString()}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-300">Account Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Account name"
                            className="bg-slate-800 border-white/10 text-white"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-slate-300">Action</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                type="button"
                                variant={mode === 'add' ? 'default' : 'outline'}
                                className={cn(
                                    "flex flex-col h-auto py-3 gap-1 border-white/10 hover:bg-white/5 hover:text-white",
                                    mode === 'add'
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                                        : "bg-slate-800 text-slate-400"
                                )}
                                onClick={() => setMode('add')}
                            >
                                <Plus size={18} />
                                <span className="text-xs">Add</span>
                            </Button>
                            <Button
                                type="button"
                                variant={mode === 'remove' ? 'default' : 'outline'}
                                className={cn(
                                    "flex flex-col h-auto py-3 gap-1 border-white/10 hover:bg-white/5 hover:text-white",
                                    mode === 'remove'
                                        ? "bg-rose-500 hover:bg-rose-600 text-white border-transparent"
                                        : "bg-slate-800 text-slate-400"
                                )}
                                onClick={() => setMode('remove')}
                            >
                                <Minus size={18} />
                                <span className="text-xs">Remove</span>
                            </Button>
                            <Button
                                type="button"
                                variant={mode === 'update' ? 'default' : 'outline'}
                                className={cn(
                                    "flex flex-col h-auto py-3 gap-1 border-white/10 hover:bg-white/5 hover:text-white",
                                    mode === 'update'
                                        ? "bg-indigo-500 hover:bg-indigo-600 text-white border-transparent"
                                        : "bg-slate-800 text-slate-400"
                                )}
                                onClick={() => setMode('update')}
                            >
                                <RefreshCw size={18} />
                                <span className="text-xs">Set</span>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-slate-300">
                            {mode === 'add' && 'Amount to Add'}
                            {mode === 'remove' && 'Amount to Remove'}
                            {mode === 'update' && 'New Balance Amount'}
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₱</span>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="pl-7 bg-slate-800 border-white/10 text-white"
                                autoFocus
                                required
                            />
                        </div>
                        {(mode === 'add' || mode === 'remove') && (
                            <p className="text-xs text-slate-400 text-right">
                                New balance: <span className="text-white font-medium">₱ {(account.balance + (mode === 'add' ? 1 : -1) * (parseFloat(amount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </p>
                        )}
                        {mode === 'update' && (
                            <p className="text-xs text-slate-500 text-right">This will override the current balance.</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className={cn(
                                "text-white min-w-[120px]",
                                mode === 'add' && "bg-emerald-500 hover:bg-emerald-600",
                                mode === 'remove' && "bg-rose-500 hover:bg-rose-600",
                                mode === 'update' && "bg-indigo-500 hover:bg-indigo-600"
                            )}
                        >
                            {mode === 'add' ? 'Confirm Add' : mode === 'remove' ? 'Confirm Remove' : 'Update Balance'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
