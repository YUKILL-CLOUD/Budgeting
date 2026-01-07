import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthPage } from './components/AuthPage';
import { BudgetForm } from './components/BudgetForm';
import { BudgetSummary } from './components/BudgetSummary';
import { PaycheckAllocator } from './components/PaycheckAllocator';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { AccountDashboard } from './components/AccountDashboard';
import { TransactionHistory } from './components/TransactionHistory';
import { TransactionModal } from './components/TransactionModal';
import { BudgetChart } from './components/BudgetChart';
import { MainDashboard } from './components/MainDashboard';
import { CategoryManager } from './components/CategoryManager';
import type { Income, Expense } from './types';
import { Plus, Wallet, Building2, ArrowRightLeft, LayoutDashboard, ClipboardList, LogOut } from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { useAccountStore } from './stores/accountStore';
import { useCategoryStore } from './stores/categoryStore';
import { useTransactionStore } from './stores/transactionStore';
import { useGoalStore } from './stores/goalStore';
import type { Session } from '@supabase/supabase-js';

type AppTab = 'overview' | 'planning' | 'accounts' | 'transactions';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persistence Keys
  const STORAGE_KEY_INCOME = 'budget_incomes_v2';
  const STORAGE_KEY_EXPENSE = 'budget_expenses_v2';
  const STORAGE_KEY_SAVINGS = 'budget_savings_v2';

  // Zustand stores
  const fetchAccounts = useAccountStore(state => state.fetchAccounts);
  const fetchCategories = useCategoryStore(state => state.fetchCategories);
  const fetchTransactions = useTransactionStore(state => state.fetchTransactions);
  const fetchGoals = useGoalStore(state => state.fetchGoals);

  // Default Data
  const defaultIncomes: Income[] = [
    { id: '1', source: 'Day Job', weeklyAmount: 4000 },
    useEffect(() => {
      if (session) {
        Promise.all([
          fetchAccounts(),
          fetchCategories(),
          fetchTransactions(),
          fetchGoals()
        ]).catch(console.error);
      }
    }, [session, fetchAccounts, fetchCategories, fetchTransactions, fetchGoals]);

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  // Route: Password Reset
  if (isPasswordReset) {
    return (
      <div className="app-container">
        <Toaster position="top-center" richColors theme="system" />
        <UpdatePassword />
      </div>
    );
  }

  // Route: Auth (IfNotLoggedIn)
  if (!session) {
    return (
      <div className="app-container">
        <Toaster position="top-center" richColors theme="system" />
        <AuthPage />
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MainDashboard />;
      case 'accounts':
        return <AccountDashboard />;
      case 'allocator':
        return <PaycheckAllocator />;
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BudgetSummary />
              <BudgetChart />
            </div>
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <ArrowRightLeft className="text-blue-500" />
                  Recent Transactions
                </h2>
              </div>
              <TransactionHistory limit={5} />
            </div>
          </div>
        );
      case 'planner':
        return <WeeklyPlanner />;
      case 'budget':
        return <BudgetForm />;
      default:
        return <MainDashboard />;
    }
  };

  return (
    <div className="app-container">
      <Toaster position="top-center" richColors theme="system" />

      <header className="app-header">
        <div className="header-content">
          <div className="logo-box">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">ZeroBudget</h1>
            <p className="text-xs text-blue-100 opacity-90">Total Balance: ${totalBalance.toFixed(2)}</p>
          </div>
        </div>
        <button className="btn-icon mobile-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <LayoutDashboard size={24} />
        </button>
        <button onClick={handleSignOut} className="btn-logout-header" title="Sign Out">
          <LogOut size={18} />
        </button>
      </header>


      {activeTab === 'accounts' && (
        <div className="accounts-view">
          <AccountDashboard />
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="transactions-view">
          <TransactionHistory
            onManageCategories={() => setIsCategoryManagerOpen(true)}
            onEditTransaction={(t) => {
              setEditingTransaction(t);
              setIsModalOpen(true);
            }}
          />
        </div>
      )}
    </main>

      {/* Floating Action Button */ }
  <button
    className="fab-button"
    onClick={() => {
      setEditingTransaction(null);
      setIsModalOpen(true);
    }}
    title="Add Transaction"
  >
    <Plus size={24} />
  </button>

  {/* Modals */ }
  {
    isModalOpen && (
      <TransactionModal
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        editingTransaction={editingTransaction}
      />
    )
  }

  {
    isCategoryManagerOpen && (
      <CategoryManager onClose={() => setIsCategoryManagerOpen(false)} />
    )
  }
    </div >
  );
}

export default App;
