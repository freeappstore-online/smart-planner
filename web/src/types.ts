export type ThemeMode = 'system' | 'light' | 'dark'

export type AppSection = 'dashboard' | 'accounts' | 'planner' | 'payments' | 'settings'

export type AccountType = 'Checking' | 'Savings' | 'Credit Card' | 'Cash'

export type AccountStatus = 'Healthy' | 'Needs Attention' | 'Overdue'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  limit: number
  paymentDue?: string
  status: AccountStatus
  institution?: string
  usage: number
  color: string
}

export type PlannerItemType = 'Shopping' | 'Recurring Bill' | 'Reminder' | 'Household Task'

export type PlannerItemStatus = 'Pending' | 'Scheduled' | 'Done' | 'Skipped'

export interface PlannerItem {
  id: string
  title: string
  type: PlannerItemType
  category: string
  amount?: number
  dueDate?: string
  status: PlannerItemStatus
  tags: string[]
  notes: string
  quantity?: number
  store?: string
  completedAt?: string
}

export type TransactionType = 'Expense' | 'Payment' | 'Income' | 'Transfer'

export type TransactionStatus = 'Pending' | 'Paid' | 'Scheduled'

export interface Transaction {
  id: string
  accountId: string
  title: string
  amount: number
  date: string
  type: TransactionType
  category: string
  status: TransactionStatus
  notes?: string
  merchant?: string
  tags: string[]
  linkedPlannerItemId?: string
}

export type DashboardWidgetKind = 'balance' | 'upcoming-payments' | 'monthly-spend' | 'shopping-summary' | 'budget-overview'

export interface DashboardWidget {
  id: string
  title: string
  caption: string
  kind: DashboardWidgetKind
  accent: string
}

export interface HubState {
  theme: ThemeMode
  accounts: Account[]
  plannerItems: PlannerItem[]
  transactions: Transaction[]
  dashboardWidgets: DashboardWidget[]
}
