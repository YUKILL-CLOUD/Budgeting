import { useEffect, useState } from 'react';
import { Wallet, LogOut, LayoutDashboard, Calculator, ArrowRightLeft, Target, Calendar, Plus, Trophy } from 'lucide-react';
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
import { TransactionModal } from './components/TransactionModal';
import { useAccountStore } from './stores/accountStore';
import { useCategoryStore } from './stores/categoryStore';
import { useTransactionStore } from './stores/transactionStore';
import { useGoalStore } from './stores/goalStore';
import { useObligationStore } from './stores/obligationStore';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Check URL for password reset route
  // Supabase sends recovery tokens in the hash fragment (e.g., #access_token=...&type=recovery)
  const isPasswordReset =
    window.location.pathname === '/update-password' ||
    window.location.hash.includes('type=recovery');

  const { fetchAccounts, accounts } = useAccountStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchTransactions } = useTransactionStore();
  const { fetchGoals } = useGoalStore();
  const { fetchObligations } = useObligationStore();

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
        fetchGoals(),
        fetchObligations()
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
        <div className="header-inner">
          <div className="logo-section">
            <div className="logo-icon-box">
              <Wallet className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="logo-text">
              <h1 className="brand-name">ZeroBudget</h1>
              <p className="balance-badge">₱ {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="btn-logout" title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>

        <nav className="horizontal-navbar">
          <div className="nav-links">
            <button
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} /> <span>Dashboard</span>
            </button>
            <button
              className={`nav-link ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              <Wallet size={18} /> <span>Accounts</span>
            </button>
            <button
              className={`nav-link ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => setActiveTab('budget')}
            >
              <Trophy size={18} /> <span>Goals</span>
            </button>
            <button
              className={`nav-link ${activeTab === 'allocator' ? 'active' : ''}`}
              onClick={() => setActiveTab('allocator')}
            >
              <Calculator size={18} /> <span>Allocator</span>
            </button>
            <button
              className={`nav-link ${activeTab === 'planner' ? 'active' : ''}`}
              onClick={() => setActiveTab('planner')}
            >
              <Calendar size={18} /> <span>Planner</span>
            </button>
            <button
              className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <Target size={18} /> <span>Reports</span>
            </button>
          </div>
          <div className="nav-actions">
            <button className="nav-btn-settings" onClick={() => setIsCategoryManagerOpen(true)}>
              <Target size={18} /> <span>Categories</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="main-content-area">
        <div className="content-container">
          {renderContent()}
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        className="fab-button"
        onClick={() => setIsTransactionModalOpen(true)}
        title="Add Transaction"
      >
        <Plus size={32} />
      </button>

      {isTransactionModalOpen && (
        <TransactionModal onClose={() => setIsTransactionModalOpen(false)} />
      )}

      {isCategoryManagerOpen && (
        <CategoryManager
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
