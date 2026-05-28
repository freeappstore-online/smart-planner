import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { AppSection, PlannerItem, PlannerItemStatus, PlannerItemType } from '../types'
import { useApp } from '../store'
import { formatCurrency, formatRelativeDays, formatShortDate } from '../utils/format'
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, Select, Textarea } from '../components/ui'
import { IconCheck, IconEdit, IconPlus, IconSearch, IconTrash } from '../components/ui/Icons'

type ModuleProps = {
  onNavigate: (section: AppSection) => void
}

type PlannerDraft = {
  title: string
  type: PlannerItemType
  category: string
  amount: string
  dueDate: string
  status: PlannerItemStatus
  tags: string
  notes: string
  quantity: string
  store: string
}

const plannerTypeOptions: PlannerItemType[] = ['Shopping', 'Recurring Bill', 'Reminder', 'Household Task']
const plannerStatusOptions: PlannerItemStatus[] = ['Pending', 'Scheduled', 'Done', 'Skipped']

function createDraft(item?: PlannerItem): PlannerDraft {
  return {
    title: item?.title ?? '',
    type: item?.type ?? 'Household Task',
    category: item?.category ?? '',
    amount: item?.amount ? String(item.amount) : '',
    dueDate: item?.dueDate ?? '',
    status: item?.status ?? 'Pending',
    tags: item?.tags.join(', ') ?? '',
    notes: item?.notes ?? '',
    quantity: item?.quantity ? String(item.quantity) : '',
    store: item?.store ?? '',
  }
}

function matchesPlannerQuery(item: PlannerItem, query: string) {
  const searchable = [item.title, item.category, item.type, item.status, item.tags.join(' '), item.notes, item.store, item.amount?.toString()]
  return searchable.join(' ').toLowerCase().includes(query.trim().toLowerCase())
}

export function Planner({ onNavigate }: ModuleProps) {
  const { plannerItems, upsertPlannerItem, deletePlannerItem } = useApp()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | PlannerItemType>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | PlannerItemStatus>('All')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PlannerDraft>(createDraft())

  const filteredItems = useMemo(() => {
    return plannerItems.filter((item) => {
      const matchesType = typeFilter === 'All' || item.type === typeFilter
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter
      return matchesType && matchesStatus && matchesPlannerQuery(item, query)
    })
  }, [plannerItems, query, statusFilter, typeFilter])

  const summary = useMemo(() => {
    return {
      shopping: plannerItems.filter((item) => item.type === 'Shopping').length,
      bills: plannerItems.filter((item) => item.type === 'Recurring Bill').length,
      reminders: plannerItems.filter((item) => item.type === 'Reminder').length,
      tasks: plannerItems.filter((item) => item.type === 'Household Task').length,
    }
  }, [plannerItems])

  function openCreate(type: PlannerItemType = 'Household Task') {
    setEditingId(null)
    setDraft({ ...createDraft(), type })
    setIsOpen(true)
  }

  function openEdit(item: PlannerItem) {
    setEditingId(item.id)
    setDraft(createDraft(item))
    setIsOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number.parseFloat(draft.amount)
    const quantity = Number.parseInt(draft.quantity, 10)

    upsertPlannerItem({
      id: editingId ?? `planner-${Date.now()}`,
      title: draft.title.trim(),
      type: draft.type,
      category: draft.category.trim() || draft.type,
      amount: Number.isFinite(amount) ? amount : undefined,
      dueDate: draft.dueDate || undefined,
      status: draft.status,
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      notes: draft.notes.trim(),
      quantity: Number.isFinite(quantity) ? quantity : undefined,
      store: draft.store.trim() || undefined,
      completedAt: draft.status === 'Done' ? new Date().toISOString() : undefined,
    })

    setIsOpen(false)
    setEditingId(null)
    setDraft(createDraft())
  }

  function toggleDone(item: PlannerItem) {
    upsertPlannerItem({
      ...item,
      status: item.status === 'Done' ? 'Pending' : 'Done',
      completedAt: item.status === 'Done' ? undefined : new Date().toISOString(),
    })
  }

  return (
    <div className="module-stack">
      <SectionHeader eyebrow="Planning" title="Household planner" description="Shopping, recurring bills, reminders, and tasks all use the same reusable item architecture." action={<Button onClick={() => openCreate()}><IconPlus className="h-4 w-4" />Add item</Button>} />

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Shopping</p><p className="mt-3 font-display text-[clamp(1.65rem,3vw,2.55rem)] font-semibold leading-tight text-[var(--ink)]">{summary.shopping}</p></Card>
        <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Recurring bills</p><p className="mt-3 font-display text-[clamp(1.65rem,3vw,2.55rem)] font-semibold leading-tight text-[var(--ink)]">{summary.bills}</p></Card>
        <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Reminders</p><p className="mt-3 font-display text-[clamp(1.65rem,3vw,2.55rem)] font-semibold leading-tight text-[var(--ink)]">{summary.reminders}</p></Card>
        <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Household tasks</p><p className="mt-3 font-display text-[clamp(1.65rem,3vw,2.55rem)] font-semibold leading-tight text-[var(--ink)]">{summary.tasks}</p></Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items, tags, stores, or notes" />
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as PlannerItemType | 'All')}>
            <option value="All">All types</option>
            {plannerTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as PlannerItemStatus | 'All')}>
            <option value="All">All status</option>
            {plannerStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </Select>
          <Button variant="subtle" onClick={() => onNavigate('payments')}><IconSearch className="h-4 w-4" />Open payments</Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredItems.map((item) => (
          <Card key={item.id} className={`planner-card p-5 sm:p-6 ${item.status === 'Done' ? 'is-complete' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-2xl font-semibold text-[var(--ink)]">{item.title}</h3>
                  <Badge color={item.type === 'Recurring Bill' ? 'warning' : item.type === 'Shopping' ? 'accent' : 'muted'}>{item.type}</Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.category}</p>
              </div>
              <button type="button" className="planner-toggle" onClick={() => toggleDone(item)} aria-label="Toggle planner status">
                <IconCheck className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge color={item.status === 'Done' ? 'success' : item.status === 'Scheduled' ? 'accent' : 'muted'}>{item.status}</Badge>
              {item.dueDate ? <Badge color="warning">{formatRelativeDays(item.dueDate)}</Badge> : null}
              {item.amount !== undefined ? <Badge color="success">{formatCurrency(item.amount)}</Badge> : null}
              {item.store ? <Badge color="accent">{item.store}</Badge> : null}
            </div>

            {item.notes ? <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{item.notes}</p> : null}

            <div className="mt-5 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
              <p>Due {formatShortDate(item.dueDate)}</p>
              <p>{item.quantity ? `Qty ${item.quantity}` : 'Quantity not set'}</p>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => <Badge key={tag} color="muted">{tag}</Badge>)}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="px-3" onClick={() => openEdit(item)}><IconEdit className="h-4 w-4" /></Button>
                <Button variant="danger" className="px-3" onClick={() => deletePlannerItem(item.id)}><IconTrash className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredItems.length === 0 ? (
          <div className="xl:col-span-2">
            <EmptyState title="No planner items found" description="Shopping, reminders, and bills all use the same reusable card and form architecture." action={<Button onClick={() => openCreate()}>Create item</Button>} />
          </div>
        ) : null}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? 'Edit planner item' : 'Add planner item'} footer={<div className="flex justify-end"><Button type="submit" form="planner-form">Save item</Button></div>}>
        <form id="planner-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Title</span>
            <Input value={draft.title} onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))} required placeholder="Weekly groceries" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Type</span>
            <Select value={draft.type} onChange={(event) => setDraft((previous) => ({ ...previous, type: event.target.value as PlannerItemType }))}>
              {plannerTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Status</span>
            <Select value={draft.status} onChange={(event) => setDraft((previous) => ({ ...previous, status: event.target.value as PlannerItemStatus }))}>
              {plannerStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Category</span>
            <Input value={draft.category} onChange={(event) => setDraft((previous) => ({ ...previous, category: event.target.value }))} placeholder="Household" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Due date</span>
            <Input type="date" value={draft.dueDate} onChange={(event) => setDraft((previous) => ({ ...previous, dueDate: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Amount</span>
            <Input type="number" step="0.01" value={draft.amount} onChange={(event) => setDraft((previous) => ({ ...previous, amount: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Tags</span>
            <Input value={draft.tags} onChange={(event) => setDraft((previous) => ({ ...previous, tags: event.target.value }))} placeholder="Home, Weekly" />
          </label>
          {draft.type === 'Shopping' ? (
            <>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--muted)]">Quantity</span>
                <Input type="number" min="1" value={draft.quantity} onChange={(event) => setDraft((previous) => ({ ...previous, quantity: event.target.value }))} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--muted)]">Store</span>
                <Input value={draft.store} onChange={(event) => setDraft((previous) => ({ ...previous, store: event.target.value }))} placeholder="Market Lane" />
              </label>
            </>
          ) : null}
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Notes</span>
            <Textarea value={draft.notes} onChange={(event) => setDraft((previous) => ({ ...previous, notes: event.target.value }))} placeholder="Add context, reminders, or details" />
          </label>
        </form>
      </Modal>
    </div>
  )
}
