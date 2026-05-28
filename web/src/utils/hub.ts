import type {
  Account,
  AccountStatus,
  AccountType,
  DashboardWidget,
  HubState,
  PlannerItem,
  PlannerItemStatus,
  PlannerItemType,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../types'

const accountPalette: Record<AccountType, string> = {
  Checking: '#2563eb',
  Savings: '#06b6d4',
  'Credit Card': '#0f172a',
  Cash: '#10b981',
}

const widgetAccents = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#0f172a']

const allowedAccountStatuses: AccountStatus[] = ['Healthy', 'Needs Attention', 'Overdue']
const allowedPlannerStatuses: PlannerItemStatus[] = ['Pending', 'Scheduled', 'Done', 'Skipped']
const allowedTransactionStatuses: TransactionStatus[] = ['Pending', 'Paid', 'Scheduled']

function dayOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`
}

export function matchesQuery(fields: ReadonlyArray<string | number | undefined>, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return fields
    .filter((field): field is string | number => field !== undefined)
    .map((field) => String(field).toLowerCase())
    .join(' | ')
    .includes(normalized)
}

function accountUsage(balance: number, limit: number) {
  if (limit <= 0) return 0
  return Math.min(balance / limit, 1)
}

function accountStatus(type: AccountType, balance: number, limit: number, dueDate?: string): AccountStatus {
  if (type !== 'Credit Card') return balance < 0 ? 'Needs Attention' : 'Healthy'

  if (dueDate) {
    const due = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (due.getTime() < today.getTime()) return 'Overdue'
  }

  if (limit > 0 && balance / limit >= 0.8) return 'Needs Attention'
  return 'Healthy'
}

function plannerTypeFromLegacy(value: string | undefined): PlannerItemType {
  switch (value) {
    case 'Bill':
      return 'Recurring Bill'
    case 'Task':
      return 'Household Task'
    case 'Reminder':
      return 'Reminder'
    case 'Shopping':
      return 'Shopping'
    default:
      return 'Household Task'
  }
}

function transactionTypeFromLegacy(value: string | undefined): TransactionType {
  switch (value) {
    case 'Income':
      return 'Income'
    case 'Transfer':
      return 'Transfer'
    case 'Payment':
      return 'Payment'
    default:
      return 'Expense'
  }
}

function accountTypeFromLegacy(value: string | undefined): AccountType {
  switch (value) {
    case 'Savings':
      return 'Savings'
    case 'Cash':
      return 'Cash'
    case 'Credit':
    case 'Credit Card':
      return 'Credit Card'
    default:
      return 'Checking'
  }
}

function statusFromLegacy<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  if (!value) return fallback
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

export function normalizeAccount(value: unknown): Account | null {
  if (typeof value !== 'object' || value === null) return null

  const record = value as Record<string, unknown>
  const type = accountTypeFromLegacy(typeof record.type === 'string' ? record.type : undefined)
  const balance = typeof record.balance === 'number' && Number.isFinite(record.balance) ? record.balance : 0
  const limit = typeof record.limit === 'number' && Number.isFinite(record.limit) ? record.limit : typeof record.creditLimit === 'number' ? record.creditLimit : 0
  const paymentDue = typeof record.paymentDue === 'string' ? record.paymentDue : typeof record.dueDate === 'string' ? record.dueDate : undefined

  return {
    id: typeof record.id === 'string' ? record.id : createId('account'),
    name: typeof record.name === 'string' ? record.name : 'Household Account',
    type,
    balance,
    limit,
    paymentDue,
    status: statusFromLegacy(
      typeof record.status === 'string' ? record.status : undefined,
      allowedAccountStatuses,
      accountStatus(type, balance, limit, paymentDue),
    ),
    institution: typeof record.institution === 'string' ? record.institution : undefined,
    usage: accountUsage(balance, limit),
    color: typeof record.color === 'string' ? record.color : accountPalette[type],
  }
}

export function normalizePlannerItem(value: unknown): PlannerItem | null {
  if (typeof value !== 'object' || value === null) return null

  const record = value as Record<string, unknown>
  const type = plannerTypeFromLegacy(typeof record.type === 'string' ? record.type : undefined)
  const status = statusFromLegacy(
    typeof record.status === 'string' ? record.status : typeof record.done === 'boolean' && record.done ? 'Done' : undefined,
    allowedPlannerStatuses,
    type === 'Household Task' ? 'Pending' : 'Scheduled',
  )

  return {
    id: typeof record.id === 'string' ? record.id : createId('planner'),
    title: typeof record.title === 'string' ? record.title : 'Planner item',
    type,
    category: typeof record.category === 'string' ? record.category : type,
    amount: typeof record.amount === 'number' && Number.isFinite(record.amount) ? record.amount : undefined,
    dueDate: typeof record.dueDate === 'string' ? record.dueDate : typeof record.due === 'string' ? record.due : undefined,
    status,
    tags: normalizeTags(record.tags),
    notes: typeof record.notes === 'string' ? record.notes : typeof record.note === 'string' ? record.note : '',
    quantity: typeof record.quantity === 'number' && Number.isFinite(record.quantity) ? record.quantity : undefined,
    store: typeof record.store === 'string' ? record.store : undefined,
    completedAt: typeof record.completedAt === 'string' ? record.completedAt : undefined,
  }
}

export function normalizeTransaction(value: unknown, fallbackAccountId: string): Transaction | null {
  if (typeof value !== 'object' || value === null) return null

  const record = value as Record<string, unknown>
  const type = transactionTypeFromLegacy(typeof record.type === 'string' ? record.type : undefined)
  const status = statusFromLegacy(
    typeof record.status === 'string' ? record.status : undefined,
    allowedTransactionStatuses,
    type === 'Income' ? 'Paid' : 'Pending',
  )

  return {
    id: typeof record.id === 'string' ? record.id : createId('transaction'),
    accountId: typeof record.accountId === 'string' ? record.accountId : fallbackAccountId,
    title: typeof record.title === 'string' ? record.title : 'Transaction',
    amount: typeof record.amount === 'number' && Number.isFinite(record.amount) ? record.amount : 0,
    date: typeof record.date === 'string' ? record.date : new Date().toISOString().slice(0, 10),
    type,
    category: typeof record.category === 'string' ? record.category : 'General',
    status,
    notes: typeof record.notes === 'string' ? record.notes : undefined,
    merchant: typeof record.merchant === 'string' ? record.merchant : undefined,
    tags: normalizeTags(record.tags),
    linkedPlannerItemId: typeof record.linkedPlannerItemId === 'string' ? record.linkedPlannerItemId : undefined,
  }
}

export function normalizeWidget(value: unknown): DashboardWidget | null {
  if (typeof value !== 'object' || value === null) return null

  const record = value as Record<string, unknown>
  const kind = typeof record.kind === 'string' ? record.kind : 'balance'

  return {
    id: typeof record.id === 'string' ? record.id : createId('widget'),
    title: typeof record.title === 'string' ? record.title : 'Overview',
    caption: typeof record.caption === 'string' ? record.caption : 'Household snapshot',
    kind: kind === 'upcoming-payments' || kind === 'monthly-spend' || kind === 'shopping-summary' || kind === 'budget-overview' || kind === 'balance' ? kind : 'balance',
    accent: typeof record.accent === 'string' ? record.accent : widgetAccents[0],
  }
}

function dayRange(start: number, end: number) {
  const dates: string[] = []
  for (let day = start; day <= end; day += 1) {
    dates.push(dayOffset(day))
  }
  return dates
}

export function createSeedState(): HubState {
  const accounts: Account[] = [
    {
      id: 'account-checking',
      name: 'Main Checking',
      type: 'Checking',
      balance: 8240.5,
      limit: 0,
      status: 'Healthy',
      institution: 'Smart Planner Bank',
      usage: 0,
      color: accountPalette.Checking,
    },
    {
      id: 'account-savings',
      name: 'Rainy Day Savings',
      type: 'Savings',
      balance: 12640.8,
      limit: 0,
      status: 'Healthy',
      institution: 'Smart Planner Bank',
      usage: 0,
      color: accountPalette.Savings,
    },
    {
      id: 'account-card',
      name: 'Family Card',
      type: 'Credit Card',
      balance: 1834.2,
      limit: 5000,
      paymentDue: dayOffset(5),
      status: 'Needs Attention',
      institution: 'Smart Planner Rewards',
      usage: accountUsage(1834.2, 5000),
      color: accountPalette['Credit Card'],
    },
  ]

  const plannerItems: PlannerItem[] = [
    {
      id: 'planner-groceries',
      title: 'Weekly grocery run',
      type: 'Shopping',
      category: 'Groceries',
      amount: 180,
      dueDate: dayOffset(2),
      status: 'Scheduled',
      tags: ['Household', 'Weekly'],
      notes: 'Fresh produce, pantry basics, and household staples.',
      quantity: 12,
      store: 'Market Lane',
    },
    {
      id: 'planner-internet',
      title: 'Internet bill',
      type: 'Recurring Bill',
      category: 'Utilities',
      amount: 94,
      dueDate: dayOffset(4),
      status: 'Pending',
      tags: ['Monthly', 'Priority'],
      notes: 'Confirm autopay is still active before due date.',
    },
    {
      id: 'planner-reminder',
      title: 'Review school forms',
      type: 'Reminder',
      category: 'Family',
      dueDate: dayOffset(1),
      status: 'Pending',
      tags: ['Admin'],
      notes: 'Sign and upload remaining school paperwork.',
    },
    {
      id: 'planner-task',
      title: 'Schedule weekend clean-up',
      type: 'Household Task',
      category: 'Home',
      dueDate: dayOffset(3),
      status: 'Scheduled',
      tags: ['Home', 'Routine'],
      notes: 'Laundry, recycling, and patio reset.',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'tx-salary',
      accountId: 'account-checking',
      title: 'Monthly salary',
      amount: 5200,
      date: dayOffset(-1),
      type: 'Income',
      category: 'Income',
      status: 'Paid',
      notes: 'Primary household inflow',
      merchant: 'Employer Payroll',
      tags: ['Income', 'Payday'],
    },
    {
      id: 'tx-groceries',
      accountId: 'account-checking',
      title: 'Groceries',
      amount: 72.38,
      date: dayOffset(-2),
      type: 'Expense',
      category: 'Groceries',
      status: 'Paid',
      notes: 'Weekly market basket',
      merchant: 'Market Lane',
      tags: ['Household'],
    },
    {
      id: 'tx-card-payment',
      accountId: 'account-checking',
      title: 'Card payment',
      amount: 250,
      date: dayOffset(0),
      type: 'Payment',
      category: 'Debt',
      status: 'Scheduled',
      notes: 'Credit card payment queued for payday',
      merchant: 'Smart Planner Rewards',
      tags: ['Debt', 'Card'],
    },
    {
      id: 'tx-utilities',
      accountId: 'account-checking',
      title: 'Electricity bill',
      amount: 94,
      date: dayOffset(-3),
      type: 'Expense',
      category: 'Utilities',
      status: 'Paid',
      merchant: 'City Power',
      tags: ['Bills'],
    },
  ]

  const dashboardWidgets: DashboardWidget[] = [
    { id: 'widget-balance', title: 'Available balance', caption: 'Across household accounts', kind: 'balance', accent: widgetAccents[0] },
    { id: 'widget-payments', title: 'Upcoming payments', caption: 'Bills due soon', kind: 'upcoming-payments', accent: widgetAccents[1] },
    { id: 'widget-spend', title: 'Monthly spend', caption: 'Current month spending', kind: 'monthly-spend', accent: widgetAccents[2] },
    { id: 'widget-shopping', title: 'Shopping summary', caption: 'Active shopping items', kind: 'shopping-summary', accent: widgetAccents[3] },
    { id: 'widget-budget', title: 'Budget overview', caption: 'Income vs. committed costs', kind: 'budget-overview', accent: widgetAccents[4] },
  ]

  return {
    theme: 'system',
    accounts,
    plannerItems,
    transactions,
    dashboardWidgets,
  }
}

export function deriveHubInsights(state: Pick<HubState, 'accounts' | 'plannerItems' | 'transactions'>) {
  const availableBalance = state.accounts.reduce((sum, account) => {
    if (account.type === 'Credit Card') {
      return sum - account.balance
    }

    return sum + account.balance
  }, 0)

  const monthlyIncome = state.transactions
    .filter((transaction) => transaction.type === 'Income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const monthlySpend = state.transactions
    .filter((transaction) => transaction.type === 'Expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const committedCosts = state.plannerItems
    .filter((item) => item.type === 'Recurring Bill' || item.type === 'Shopping')
    .reduce((sum, item) => sum + (item.amount ?? 0), 0)

  const upcomingPayments = state.plannerItems
    .filter((item) => item.type === 'Recurring Bill' || item.type === 'Shopping')
    .filter((item) => item.status !== 'Done')
    .sort((left, right) => (left.dueDate ?? '').localeCompare(right.dueDate ?? ''))

  const recentExpenses = state.transactions
    .filter((transaction) => transaction.type === 'Expense')
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4)

  const shoppingItems = state.plannerItems.filter((item) => item.type === 'Shopping')
  const activePlannerItems = state.plannerItems.filter((item) => item.status !== 'Done')

  const budgetUsage = monthlyIncome > 0 ? Math.min((monthlySpend + committedCosts) / monthlyIncome, 1) : 0

  const spendingByCategory = state.transactions
    .filter((transaction) => transaction.type === 'Expense')
    .reduce<Record<string, number>>((groups, transaction) => {
      groups[transaction.category] = (groups[transaction.category] ?? 0) + transaction.amount
      return groups
    }, {})

  const topCategory = Object.entries(spendingByCategory).sort((left, right) => right[1] - left[1])[0]

  return {
    availableBalance,
    monthlyIncome,
    monthlySpend,
    committedCosts,
    budgetUsage,
    upcomingPayments,
    recentExpenses,
    shoppingItems,
    activePlannerItems,
    topCategory,
  }
}

export function generateBudgetBars(state: Pick<HubState, 'transactions'>) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const dailyTotals = new Map<string, number>()

  for (const date of dayRange(-5, 0)) {
    dailyTotals.set(date, 0)
  }

  for (const transaction of state.transactions) {
    if (transaction.type !== 'Expense' || !transaction.date.startsWith(currentMonth)) continue
    if (!dailyTotals.has(transaction.date)) continue
    dailyTotals.set(transaction.date, (dailyTotals.get(transaction.date) ?? 0) + transaction.amount)
  }

  return Array.from(dailyTotals.entries()).map(([label, value]) => ({
    label: new Date(label).toLocaleDateString('en-US', { weekday: 'short' }),
    value,
  }))
}

export function accountColor(type: AccountType) {
  return accountPalette[type]
}
