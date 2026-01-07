import { useEffect, useState } from 'react';
import { Wallet, LogOut, LayoutDashboard, Calculator, ArrowRightLeft, Target, Calendar } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { MainDashboard } from './components/MainDashboard';
import { BudgetSummary } from './components/BudgetSummary';
import { BudgetChart } from './components/BudgetChart';
import { TransactionHistory } from './components/TransactionHistory';
import { PaycheckAllocator } from './components/PaycheckAllocator';
import { BudgetForm } from './components/BudgetForm';
import { CategoryManager } from './components/CategoryManager';
import { AccountDashboard } from './components/AccountDashboard';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { AuthPage } from './components/AuthPage';
import { UpdatePassword } from './components/UpdatePassword';
import { useAccountStore } from './stores/accountStore';
import { useCategoryStore } from './stores/categoryStore';
import { useTransactionStore } from './stores/transactionStore';
import { useGoalStore } from './stores/goalStore';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPaycheckModalOpen, setIsPaycheckModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check URL for password reset route
  const isPasswordReset = window.location.pathname === '/update-password';

  const { fetchAccounts, accounts } = useAccountStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchTransactions } = useTransactionStore();
  const { fetchGoals } = useGoalStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

      <div className="main-layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="nav-menu">
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            >
              <LayoutDashboard size={20} /> Dashboard
            </button>
            <button
              className={`nav-item ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => { setActiveTab('accounts'); setSidebarOpen(false); }}
            >
              <Wallet size={20} /> Accounts
            </button>
            <button
              className={`nav-item ${activeTab === 'allocator' ? 'active' : ''}`}
              onClick={() => { setActiveTab('allocator'); setSidebarOpen(false); }}
            >
              <Calculator size={20} /> Paycheck Allocator
            </button>
            <button
              className={`nav-item ${activeTab === 'planner' ? 'active' : ''}`}
              onClick={() => { setActiveTab('planner'); setSidebarOpen(false); }}
            >
              <Calendar size={20} /> Weekly Planner
            </button>
            <button
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }}
            >
              <Target size={20} /> Reports & History
            </button>

            <div className="nav-divider"></div>

            <button
              className="nav-item"
              onClick={() => { setIsCategoryManagerOpen(true); setSidebarOpen(false); }}
            >
              <Target size={20} /> Manage Categories
            </button>
          </nav>
        </aside>

        <main className="content-area">
          {renderContent()}
        </main>
      </div>

      <PaycheckAllocator
        isOpen={isPaycheckModalOpen}
        onClose={() => setIsPaycheckModalOpen(false)}
      />

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </div>
  );
}

export default App;
