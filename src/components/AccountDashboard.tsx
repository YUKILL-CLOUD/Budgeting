import React, { useEffect, useState } from 'react';
import { useAccountStore } from '../stores/accountStore';
import { Building2, Wallet as WalletIcon, PiggyBank, Banknote, TrendingUp, Plus, Edit, CreditCard } from 'lucide-react';
import { EditAccountModal } from './EditAccountModal';
import { AddAccountModal } from './AddAccountModal';
import type { Account } from '../lib/db';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
    Building2,
    Wallet: WalletIcon,
    PiggyBank,
    Banknote,
    CreditCard,
};

export const AccountDashboard: React.FC = () => {
    const { accounts, loading, fetchAccounts, getTotalBalance } = useAccountStore();
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [showAddAccount, setShowAddAccount] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const totalBalance = getTotalBalance();

    if (loading) {
        return <div className="loading">Loading accounts...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Building2 className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Accounts</h2>
                        <p className="text-sm text-slate-400">Manage your bank accounts and digital wallets</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Balance Card */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-indigo-600 to-violet-700 border-none shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-100 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Total Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-white">
                            ₱ {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-indigo-200 mt-1">Across all accounts</p>
                    </CardContent>
                </Card>

                {accounts.map((account) => {
                    const Icon = iconMap[account.icon] || WalletIcon;
                    return (
                        <Card key={account.id} className="bg-[#1e293b] border-white/5 hover:border-white/10 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-md", "bg-opacity-10")} style={{ backgroundColor: `${account.color}20`, color: account.color }}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <CardTitle className="text-base font-semibold text-white">{account.name}</CardTitle>
                                        <CardDescription className="text-xs text-slate-400">{account.type}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-200">
                                    ₱ {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-white/10 hover:bg-white/5 hover:text-white text-slate-400"
                                    onClick={() => setEditingAccount(account)}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Manage
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}

                {/* Add Account Card */}
                <Card
                    className="flex flex-col items-center justify-center p-6 border-dashed border-2 border-white/10 bg-transparent hover:bg-white/5 cursor-pointer transition-colors min-h-[200px]"
                    onClick={() => setShowAddAccount(true)}
                >
                    <div className="rounded-full bg-slate-800 p-4 mb-3 group-hover:bg-slate-700 transition-colors">
                        <Plus className="h-8 w-8 text-slate-400 group-hover:text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300">New Account</h3>
                    <p className="text-sm text-slate-500">Add a savings or checking account</p>
                </Card>
            </div>

            {/* Edit Modal */}
            {editingAccount && (
                <EditAccountModal
                    account={editingAccount}
                    onClose={() => setEditingAccount(null)}
                />
            )}

            {/* Add Modal */}
            {showAddAccount && (
                <AddAccountModal
                    onClose={() => setShowAddAccount(false)}
                />
            )}
        </div>
    );
};
