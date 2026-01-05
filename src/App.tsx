import { useState, useEffect } from 'react';
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
import { Plus, Wallet, Building2, ArrowRightLeft, LayoutDashboard, ClipboardList } from 'lucide-react';
import { Toaster } from 'sonner';
import { seedDatabase } from './lib/seed';
import { useAccountStore } from './stores/accountStore';
import { useCategoryStore } from './stores/categoryStore';
import { useTransactionStore } from './stores/transactionStore';
import { useGoalStore } from './stores/goalStore';

type AppTab = 'overview' | 'planning' | 'accounts' | 'transactions';

function App() {
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
    { id: '2', source: 'Night Job', weeklyAmount: 7000 },
  ];

  const defaultExpenses: Expense[] = [
    { id: '1', name: 'Rent', amount: 4000, frequency: 'Monthly', isFlexible: false },
    { id: '2', name: 'Electricity', amount: 2000, frequency: 'Monthly', isFlexible: false },
    { id: '3', name: 'Water Bill', amount: 300, frequency: 'Monthly', isFlexible: false },
    { id: '4', name: 'Gas', amount: 350, frequency: 'Weekly', isFlexible: true },
    { id: '5', name: 'Loans', amount: 2000, frequency: 'Monthly', isFlexible: false },
    { id: '6', name: 'Wifi', amount: 200, frequency: 'Weekly', isFlexible: false },
    { id: '7', name: 'Coffee', amount: 400, frequency: 'Weekly', isFlexible: true },
    { id: '8', name: 'Food (Weekdays)', amount: 0, frequency: 'Weekly', isFlexible: true },
    { id: '9', name: 'Food (Weekends)', amount: 0, frequency: 'Weekly', isFlexible: true },
  ];

  // State initialization
  const [incomes, setIncomes] = useState<Income[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INCOME);
    return saved ? JSON.parse(saved) : defaultIncomes;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPENSE);
    return saved ? JSON.parse(saved) : defaultExpenses;
  });

  const [savings, setSavings] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SAVINGS);
    return saved ? parseFloat(saved) : 0;
  });

  // Initialize database
  useEffect(() => {
    const initDB = async () => {
      await seedDatabase();
      await fetchAccounts();
      await fetchCategories();
      await fetchTransactions();
      await fetchGoals();
    };
    initDB();
  }, [fetchAccounts, fetchCategories, fetchTransactions, fetchGoals]);

  // Navigation state
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INCOME, JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPENSE, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SAVINGS, savings.toString());
  }, [savings]);

  return (
    <div className="app-main-wrapper">
      <Toaster position="top-right" richColors />
      <header className="app-header">
        <div className="logo">
          <Wallet className="logo-icon" size={32} />
          <h1>Zero<span className="accent">Budget</span></h1>
        </div>
        <p className="tagline">Personal Zero-Based Budgeting (PHP)</p>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'planning' ? 'active' : ''}`}
          onClick={() => setActiveTab('planning')}
        >
          <ClipboardList size={18} />
          <span>Budget Planning</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          <Building2 size={18} />
          <span>Accounts</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <ArrowRightLeft size={18} />
          <span>Transactions</span>
        </button>
      </nav>

      <main className="app-container">
        {activeTab === 'overview' && (
          <div className="overview-view">
            <MainDashboard expenses={expenses} />
          </div>
        )}

        {activeTab === 'planning' && (
          <div className="main-content">
            <div className="left-column">
              <BudgetForm
                incomes={incomes}
                setIncomes={setIncomes}
                expenses={expenses}
                setExpenses={setExpenses}
                savings={savings}
                setSavings={setSavings}
              />
            </div>

            <div className="right-column">
              <BudgetChart expenses={expenses} />
              <BudgetSummary
                incomes={incomes}
                expenses={expenses}
                savings={savings}
              />
              <PaycheckAllocator expenses={expenses} />
              <WeeklyPlanner expenses={expenses} />
            </div>
          </div>
        )}

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

      {/* Floating Action Button */}
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

      {/* Modals */}
      {isModalOpen && (
        <TransactionModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
          editingTransaction={editingTransaction}
        />
      )}

      {isCategoryManagerOpen && (
        <CategoryManager onClose={() => setIsCategoryManagerOpen(false)} />
      )}
    </div>
  );
}

export default App;
