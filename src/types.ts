export interface Income {
    id: string;
    source: string;
    weeklyAmount: number;
}

export type ExpenseFrequency = 'Weekly' | 'Monthly' | 'Annual';

export interface Expense {
    id: string;
    name: string;
    amount: number;
    frequency: ExpenseFrequency;
    isFlexible: boolean; // For Weekly Planner
}

export interface SavingsGoal {
    id: string;
    name: string;
    amount: number; // Monthly target
}

export interface BudgetState {
    incomes: Income[];
    expenses: Expense[];
    savings: SavingsGoal[];
}
