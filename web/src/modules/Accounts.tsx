import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { AppSection, Account, AccountStatus, AccountType } from '../types'
import { useApp } from '../store'
import { accountColor } from '../utils/hub'
import { formatCurrency, formatPercent, formatShortDate } from '../utils/format'
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, Select } from '../components/ui'
import { IconEdit, IconPlus, IconSearch, IconTrash } from '../components/ui/Icons'

type ModuleProps = {
  onNavigate: (section: AppSection) => void
}

type AccountDraft = {
  name: string
  type: AccountType
  balance: string
  limit: string
  paymentDue: string
  institution: string
  status: AccountStatus
}

const accountTypeOptions: AccountType[] = ['Checking', 'Savings', 'Credit Card', 'Cash']
const accountStatusOptions: AccountStatus[] = ['Healthy', 'Needs Attention', 'Overdue']

function createDraft(account?: Account): AccountDraft {
  return {
    name: account?.name ?? '',
    type: account?.type ?? 'Checking',
    balance: account ? String(account.balance) : '',
    limit: account ? String(account.limit) : '',
    paymentDue: account?.paymentDue ?? '',
    institution: account?.institution ?? '',
    status: account?.status ?? 'Healthy',
  }
}

export function Accounts({ onNavigate }: ModuleProps) {
  const { accounts, upsertAccount, deleteAccount } = useApp()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'All' | AccountType>('All')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<AccountDraft>(createDraft())

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesFilter = filter === 'All' || account.type === filter
      const matchesSearch = `${account.name} ${account.type} ${account.institution ?? ''} ${account.status}`.toLowerCase().includes(query.trim().toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [accounts, filter, query])

  const totals = useMemo(() => {
    const totalBalance = accounts.reduce((sum, account) => sum + (account.type === 'Credit Card' ? -account.balance : account.balance), 0)
    const cards = accounts.filter((account) => account.type === 'Credit Card')
    const usage = cards.reduce((sum, account) => sum + account.usage, 0)
    return { totalBalance, creditCards: cards.length, averageUsage: cards.length ? usage / cards.length : 0 }
  }, [accounts])

  function openCreate(type: AccountType = 'Checking') {
    setEditingId(null)
    setDraft({ ...createDraft(), type })
    setIsOpen(true)
  }

  function openEdit(account: Account) {
    setEditingId(account.id)
    setDraft(createDraft(account))
    setIsOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const balance = Number.parseFloat(draft.balance) || 0
    const limit = Number.parseFloat(draft.limit) || 0
    const usage = limit > 0 ? Math.min(balance / limit, 1) : 0
    const status = draft.type === 'Credit Card' ? draft.status : balance < 0 ? 'Needs Attention' : 'Healthy'

    upsertAccount({
      id: editingId ?? `account-${Date.now()}`,
      name: draft.name.trim(),
      type: draft.type,
      balance,
      limit,
      paymentDue: draft.paymentDue || undefined,
      institution: draft.institution || undefined,
      status,
      usage,
      color: accountColor(draft.type),
    })

    setIsOpen(false)
    setEditingId(null)
    setDraft(createDraft())
  }

  return (
    <div className="module-stack">
      <SectionHeader eyebrow="Accounts" title="Unified account system" description="One reusable card pattern for checking, savings, and credit cards." action={<Button onClick={() => openCreate()}><IconPlus className="h-4 w-4" />Add account</Button>} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Household balance</p><p className="mt-3 font-display text-[clamp(1.65rem,3vw,2.55rem)] font-semibold leading-tight text-[var(--ink)]">{formatCurrency(totals.totalBalance)}</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Combined checking, savings, and card liability.</p></Card>
        <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Credit usage</p><p className="mt-3 font-display text-[clamp(1.65rem,3vw,2.55rem)] font-semibold leading-tight text-[var(--ink)]">{formatPercent(totals.averageUsage * 100)}</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Average usage across all cards with a limit.</p></Card>
        <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Accounts tracked</p><p className="mt-3 font-display text-[clamp(1.65rem,3vw,2.55rem)] font-semibold leading-tight text-[var(--ink)]">{accounts.length}</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">A single source of truth for balances and timing.</p></Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto] xl:items-center">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search accounts, institutions, or status" />
          <div className="flex flex-wrap gap-2">
            <Button variant={filter === 'All' ? 'primary' : 'outline'} onClick={() => setFilter('All')}>All</Button>
            {accountTypeOptions.map((type) => <Button key={type} variant={filter === type ? 'primary' : 'outline'} onClick={() => setFilter(type)}>{type}</Button>)}
          </div>
          <Button variant="subtle" onClick={() => onNavigate('planner')}><IconSearch className="h-4 w-4" />Explore planner</Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredAccounts.map((account) => (
          <Card key={account.id} className="account-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{account.institution ?? 'Household account'}</p>
                <h3 className="mt-2 font-display text-3xl font-semibold text-[var(--ink)]">{account.name}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{account.type}</p>
              </div>
              <Badge color={account.status === 'Healthy' ? 'success' : account.status === 'Needs Attention' ? 'warning' : 'danger'}>{account.status}</Badge>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Balance</p>
                <p className="mt-2 font-display text-4xl font-semibold text-[var(--ink)]">{formatCurrency(account.balance)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{account.type === 'Credit Card' ? 'Limit' : 'Status'}</p>
                <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{account.type === 'Credit Card' ? formatCurrency(account.limit) : account.status}</p>
              </div>
            </div>

            {account.type === 'Credit Card' && account.limit > 0 ? (
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                  <span>Usage</span>
                  <span>{formatPercent(account.usage * 100)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--line)]">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--warning),var(--danger))]" style={{ width: `${account.usage * 100}%` }} />
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
              <div className="space-y-1 text-sm text-[var(--muted)]">
                {account.paymentDue ? <p>Payment due {formatShortDate(account.paymentDue)}</p> : <p>No due date attached</p>}
                {account.limit > 0 ? <p>Limit {formatCurrency(account.limit)}</p> : <p>Flexible balance account</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="px-3" onClick={() => openEdit(account)}><IconEdit className="h-4 w-4" /></Button>
                <Button variant="danger" className="px-3" onClick={() => deleteAccount(account.id)}><IconTrash className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredAccounts.length === 0 ? (
          <div className="xl:col-span-2">
            <EmptyState title="No accounts found" description="Search is scoped to the unified account system, so checking, savings, and cards all share the same card layout." action={<Button onClick={() => openCreate()}>Create an account</Button>} />
          </div>
        ) : null}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? 'Edit account' : 'Add account'} footer={<div className="flex justify-end"><Button type="submit" form="account-form">Save account</Button></div>}>
        <form id="account-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Account name</span>
            <Input value={draft.name} onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))} placeholder="Main checking" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Type</span>
            <Select value={draft.type} onChange={(event) => setDraft((previous) => ({ ...previous, type: event.target.value as AccountType }))}>
              {accountTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Status</span>
            <Select value={draft.status} onChange={(event) => setDraft((previous) => ({ ...previous, status: event.target.value as AccountStatus }))}>
              {accountStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Balance</span>
            <Input type="number" step="0.01" value={draft.balance} onChange={(event) => setDraft((previous) => ({ ...previous, balance: event.target.value }))} required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Limit</span>
            <Input type="number" step="0.01" value={draft.limit} onChange={(event) => setDraft((previous) => ({ ...previous, limit: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Institution</span>
            <Input value={draft.institution} onChange={(event) => setDraft((previous) => ({ ...previous, institution: event.target.value }))} placeholder="Smart Planner Bank" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Payment due</span>
            <Input type="date" value={draft.paymentDue} onChange={(event) => setDraft((previous) => ({ ...previous, paymentDue: event.target.value }))} />
          </label>
        </form>
      </Modal>
    </div>
  )
}
