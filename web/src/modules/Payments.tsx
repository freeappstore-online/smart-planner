import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { AppSection, Transaction, TransactionStatus, TransactionType } from '../types'
import { useApp } from '../store'
import { formatCurrency, formatLongDate } from '../utils/format'
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, Select, Textarea } from '../components/ui'
import { IconCheck, IconEdit, IconPlus, IconSearch, IconTrash } from '../components/ui/Icons'

type ModuleProps = {
  onNavigate: (section: AppSection) => void
}

type PaymentDraft = {
  title: string
  accountId: string
  type: TransactionType
  amount: string
  date: string
  status: TransactionStatus
  category: string
  merchant: string
  tags: string
  notes: string
}

const transactionTypeOptions: TransactionType[] = ['Expense', 'Payment', 'Income', 'Transfer']
const transactionStatusOptions: TransactionStatus[] = ['Pending', 'Paid', 'Scheduled']

function createDraft(transaction?: Transaction): PaymentDraft {
  return {
    title: transaction?.title ?? '',
    accountId: transaction?.accountId ?? '',
    type: transaction?.type ?? 'Expense',
    amount: transaction ? String(transaction.amount) : '',
    date: transaction?.date ?? new Date().toISOString().slice(0, 10),
    status: transaction?.status ?? 'Pending',
    category: transaction?.category ?? '',
    merchant: transaction?.merchant ?? '',
    tags: transaction?.tags.join(', ') ?? '',
    notes: transaction?.notes ?? '',
  }
}

function matchesTransactionQuery(transaction: Transaction, accountName: string, query: string) {
  const searchable = [transaction.title, transaction.category, transaction.type, transaction.status, transaction.merchant, transaction.notes, accountName, transaction.tags.join(' ')]
  return searchable.join(' ').toLowerCase().includes(query.trim().toLowerCase())
}

export function Payments({ onNavigate }: ModuleProps) {
  const { transactions, accounts, upsertTransaction, deleteTransaction } = useApp()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | TransactionType>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | TransactionStatus>('All')
  const [accountFilter, setAccountFilter] = useState<'All' | string>('All')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PaymentDraft>(createDraft())

  const accountMap = useMemo(() => new Map(accounts.map((account) => [account.id, account.name])), [accounts])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const accountName = accountMap.get(transaction.accountId) ?? 'Unknown account'
      const matchesType = typeFilter === 'All' || transaction.type === typeFilter
      const matchesStatus = statusFilter === 'All' || transaction.status === statusFilter
      const matchesAccount = accountFilter === 'All' || transaction.accountId === accountFilter
      return matchesType && matchesStatus && matchesAccount && matchesTransactionQuery(transaction, accountName, query)
    })
  }, [accountFilter, accountMap, query, statusFilter, transactions, typeFilter])

  const summary = useMemo(() => {
    return {
      expenses: transactions.filter((transaction) => transaction.type === 'Expense').reduce((sum, transaction) => sum + transaction.amount, 0),
      paid: transactions.filter((transaction) => transaction.status === 'Paid').length,
      scheduled: transactions.filter((transaction) => transaction.status === 'Scheduled').length,
    }
  }, [transactions])

  function openCreate(type: TransactionType = 'Expense') {
    setEditingId(null)
    setDraft({ ...createDraft(), type })
    setIsOpen(true)
  }

  function openEdit(transaction: Transaction) {
    setEditingId(transaction.id)
    setDraft(createDraft(transaction))
    setIsOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    upsertTransaction({
      id: editingId ?? `transaction-${Date.now()}`,
      title: draft.title.trim(),
      accountId: draft.accountId,
      type: draft.type,
      amount: Number.parseFloat(draft.amount) || 0,
      date: draft.date,
      status: draft.status,
      category: draft.category.trim() || 'General',
      merchant: draft.merchant.trim() || undefined,
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      notes: draft.notes.trim() || undefined,
    })

    setIsOpen(false)
    setEditingId(null)
    setDraft(createDraft())
  }

  function markPaid(transaction: Transaction) {
    upsertTransaction({ ...transaction, status: 'Paid' })
  }

  return (
    <div className="module-stack">
      <SectionHeader eyebrow="Payments" title="Transaction system" description="One reusable transaction model for expenses, payments, income, and transfers." action={<Button onClick={() => openCreate()}><IconPlus className="h-4 w-4" />Add transaction</Button>} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--muted)">Tracked expenses</p><p className="mt-3 font-display text-[clamp(1.65rem,3vw,2.55rem)] font-semibold leading-tight text-(--ink)">{formatCurrency(summary.expenses)}</p></Card>
        <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--muted)">Paid transactions</p><p className="mt-3 font-display text-[clamp(1.65rem,3vw,2.55rem)] font-semibold leading-tight text-(--ink)">{summary.paid}</p></Card>
        <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--muted)">Scheduled items</p><p className="mt-3 font-display text-[clamp(1.65rem,3vw,2.55rem)] font-semibold leading-tight text-(--ink)">{summary.scheduled}</p></Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="grid gap-3 xl:grid-cols-[1.2fr_auto_auto_auto_auto] xl:items-center">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, merchant, category, or notes" />
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TransactionType | 'All')}>
            <option value="All">All types</option>
            {transactionTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TransactionStatus | 'All')}>
            <option value="All">All status</option>
            {transactionStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </Select>
          <Select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
            <option value="All">All accounts</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </Select>
          <Button variant="subtle" onClick={() => onNavigate('accounts')}><IconSearch className="h-4 w-4" />Open accounts</Button>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredTransactions.map((transaction) => {
          const accountName = accountMap.get(transaction.accountId) ?? 'Unknown account'
          const isIncome = transaction.type === 'Income'

          return (
            <Card key={transaction.id} className="transaction-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-2xl font-semibold text-(--ink)">{transaction.title}</h3>
                    <Badge color={transaction.type === 'Income' ? 'success' : transaction.type === 'Payment' ? 'accent' : 'muted'}>{transaction.type}</Badge>
                    <Badge color={transaction.status === 'Paid' ? 'success' : transaction.status === 'Scheduled' ? 'warning' : 'muted'}>{transaction.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-(--muted)">{transaction.category} · {accountName} · {formatLongDate(transaction.date)}</p>
                  {transaction.merchant ? <p className="mt-2 text-sm text-(--muted)">Merchant: {transaction.merchant}</p> : null}
                </div>
                <div className="text-right">
                  <p className={`font-display text-3xl font-semibold ${isIncome ? 'text-(--success)' : 'text-(--ink)'}`}>{isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-(--muted)">{transaction.tags[0] ?? 'Household'}</p>
                </div>
              </div>

              {transaction.notes ? <p className="mt-4 text-sm leading-6 text-(--muted)">{transaction.notes}</p> : null}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-(--line) pt-4">
                <div className="flex flex-wrap gap-2">
                  {transaction.tags.map((tag) => <Badge key={tag} color="muted">{tag}</Badge>)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {transaction.status !== 'Paid' ? <Button variant="outline" className="px-3" onClick={() => markPaid(transaction)}><IconCheck className="h-4 w-4" /></Button> : null}
                  <Button variant="outline" className="px-3" onClick={() => openEdit(transaction)}><IconEdit className="h-4 w-4" /></Button>
                  <Button variant="danger" className="px-3" onClick={() => deleteTransaction(transaction.id)}><IconTrash className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          )
        })}

        {filteredTransactions.length === 0 ? (
          <EmptyState title="No transactions found" description="All spending, bill payments, income, and transfers share one transaction model with reusable filters and actions." action={<Button onClick={() => openCreate()}>Create transaction</Button>} />
        ) : null}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? 'Edit transaction' : 'Add transaction'} footer={<div className="flex justify-end"><Button type="submit" form="payment-form">Save transaction</Button></div>}>
        <form id="payment-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-(--muted)">Title</span>
            <Input value={draft.title} onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))} placeholder="Electric bill" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-(--muted)">Account</span>
            <Select value={draft.accountId} onChange={(event) => setDraft((previous) => ({ ...previous, accountId: event.target.value }))} required>
              <option value="" disabled>Select an account</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-(--muted)">Type</span>
            <Select value={draft.type} onChange={(event) => setDraft((previous) => ({ ...previous, type: event.target.value as TransactionType }))}>
              {transactionTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-(--muted)">Amount</span>
            <Input type="number" step="0.01" value={draft.amount} onChange={(event) => setDraft((previous) => ({ ...previous, amount: event.target.value }))} required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-(--muted)">Date</span>
            <Input type="date" value={draft.date} onChange={(event) => setDraft((previous) => ({ ...previous, date: event.target.value }))} required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-(--muted)">Status</span>
            <Select value={draft.status} onChange={(event) => setDraft((previous) => ({ ...previous, status: event.target.value as TransactionStatus }))}>
              {transactionStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-(--muted)">Category</span>
            <Input value={draft.category} onChange={(event) => setDraft((previous) => ({ ...previous, category: event.target.value }))} placeholder="Utilities" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-(--muted)">Merchant</span>
            <Input value={draft.merchant} onChange={(event) => setDraft((previous) => ({ ...previous, merchant: event.target.value }))} placeholder="City Power" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-(--muted)">Tags</span>
            <Input value={draft.tags} onChange={(event) => setDraft((previous) => ({ ...previous, tags: event.target.value }))} placeholder="Bills, Household" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-(--muted)">Notes</span>
            <Textarea value={draft.notes} onChange={(event) => setDraft((previous) => ({ ...previous, notes: event.target.value }))} placeholder="Optional payment details" />
          </label>
        </form>
      </Modal>
    </div>
  )
}
