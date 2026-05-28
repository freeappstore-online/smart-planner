import type { AppSection } from '../types'
import { useApp } from '../store'
import { deriveHubInsights, generateBudgetBars } from '../utils/hub'
import { formatCurrency, formatLongDate, formatPercent, formatRelativeDays, formatShortDate } from '../utils/format'
import { Badge, Button, Card, EmptyState, MiniBarChart, SectionHeader, StatCard } from '../components/ui'
import { IconAccounts, IconPayments, IconPlanner, IconPlannerMark } from '../components/ui/Icons'

type ModuleProps = {
  onNavigate: (section: AppSection) => void
}

export function Dashboard({ onNavigate }: ModuleProps) {
  const { accounts, plannerItems, transactions } = useApp()
  const insights = deriveHubInsights({ accounts, plannerItems, transactions })
  const chartBars = generateBudgetBars({ transactions })

  const overdueItems = plannerItems.filter((item) => item.dueDate && new Date(item.dueDate).getTime() < Date.now() && item.status !== 'Done').length

  return (
    <div className="module-stack">
      <SectionHeader
        eyebrow="Central hub"
        title="Dashboard"
        description="A calm command center for money, shopping, bills, and daily organization."
        action={<Button onClick={() => onNavigate('payments')}>Record payment</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard label="Available balance" value={formatCurrency(insights.availableBalance)} caption={`${accounts.length} accounts tracked`} accent="#0f172a" />
        <StatCard label="Upcoming payments" value={insights.upcomingPayments.length} caption={`${overdueItems} overdue planning items`} accent="#2563eb" />
        <StatCard label="Monthly spend" value={formatCurrency(insights.monthlySpend)} caption={`${insights.recentExpenses.length} recent expenses`} accent="#06b6d4" />
        <StatCard label="Budget usage" value={formatPercent(insights.budgetUsage * 100)} caption={`${insights.activePlannerItems.length} active planning items`} accent="#10b981" progress={insights.budgetUsage * 100} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="p-5 sm:p-6">
          <SectionHeader
            eyebrow="Cash flow"
            title="Monthly spending rhythm"
            description="A compact view of the current month that keeps the story clear without turning the dashboard into noise."
          />
          <MiniBarChart bars={chartBars} />
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeader eyebrow="Quick actions" title="One-tap shortcuts" description="Jump to the focused module that owns each workflow." />
          <div className="space-y-3">
            <button type="button" className="quick-action" onClick={() => onNavigate('accounts')}>
              <span className="quick-action-icon"><IconAccounts className="h-4 w-4" /></span>
              <span><strong>Accounts</strong><small>Manage balances and card usage</small></span>
            </button>
            <button type="button" className="quick-action" onClick={() => onNavigate('planner')}>
              <span className="quick-action-icon"><IconPlanner className="h-4 w-4" /></span>
              <span><strong>Planner</strong><small>Track shopping, bills, and reminders</small></span>
            </button>
            <button type="button" className="quick-action" onClick={() => onNavigate('payments')}>
              <span className="quick-action-icon"><IconPayments className="h-4 w-4" /></span>
              <span><strong>Payments</strong><small>Record and reconcile spending</small></span>
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-(--line) bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_12%,var(--paper)),color-mix(in_srgb,var(--cyan)_10%,var(--paper)))] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--muted) wrap-break-word">Budget snapshot</p>
                <p className="mt-2 wrap-break-word font-display text-[clamp(1.8rem,4vw,2.5rem)] font-semibold text-(--ink)">{formatPercent(insights.budgetUsage * 100)}</p>
              </div>
              <IconPlannerMark className="h-9 w-9 shrink-0 text-(--accent)" />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-(--muted)">
              <div className="flex items-center justify-between gap-4"><span className="wrap-break-word">Income</span><strong className="wrap-break-word text-(--ink)">{formatCurrency(insights.monthlyIncome)}</strong></div>
              <div className="flex items-center justify-between gap-4"><span className="wrap-break-word">Committed costs</span><strong className="wrap-break-word text-(--ink)">{formatCurrency(insights.committedCosts)}</strong></div>
              <div className="flex items-center justify-between gap-4"><span className="wrap-break-word">Top category</span><strong className="wrap-break-word text-(--ink)">{insights.topCategory ? insights.topCategory[0] : 'None yet'}</strong></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <SectionHeader eyebrow="Payments" title="Upcoming commitments" description="Bills and shopping items that need attention soon." action={<Button variant="outline" onClick={() => onNavigate('planner')}>Open planner</Button>} />
          {insights.upcomingPayments.length === 0 ? (
            <EmptyState title="Nothing urgent" description="Create a planner item to start tracking recurring commitments here." action={<Button onClick={() => onNavigate('planner')}>Add planner item</Button>} />
          ) : (
            <div className="space-y-3">
              {insights.upcomingPayments.map((item) => (
                <div key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-[1.25rem] border border-(--line) bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="max-w-full wrap-break-word font-semibold text-(--ink)">{item.title}</h4>
                      <Badge color={item.type === 'Recurring Bill' ? 'warning' : 'accent'}>{item.type}</Badge>
                    </div>
                    <p className="mt-1 wrap-break-word text-sm text-(--muted)">{item.category} · {formatRelativeDays(item.dueDate)}</p>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="wrap-break-word font-display text-lg font-semibold text-(--ink) sm:text-xl">{formatCurrency(item.amount ?? 0)}</p>
                    <p className="mt-1 wrap-break-word text-xs uppercase tracking-[0.18em] text-(--muted)">{item.store ?? 'Household'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeader eyebrow="Transactions" title="Recent expenses" description="A focused list of the latest spending activity." action={<Button variant="outline" onClick={() => onNavigate('payments')}>Open payments</Button>} />
          {insights.recentExpenses.length === 0 ? (
            <EmptyState title="No expenses yet" description="Spend records will appear here once they are logged in the payments module." action={<Button onClick={() => onNavigate('payments')}>Add transaction</Button>} />
          ) : (
            <div className="space-y-3">
              {insights.recentExpenses.map((transaction) => (
                <div key={transaction.id} className="flex min-w-0 items-center justify-between gap-4 rounded-[1.25rem] border border-(--line) bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="max-w-full wrap-break-word font-semibold text-(--ink)">{transaction.title}</h4>
                      <Badge color="muted">{transaction.category}</Badge>
                    </div>
                    <p className="mt-1 wrap-break-word text-sm text-(--muted)">{formatLongDate(transaction.date)} · {transaction.merchant ?? 'Local account'}</p>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="wrap-break-word font-display text-lg font-semibold text-(--ink) sm:text-xl">-{formatCurrency(transaction.amount)}</p>
                    <p className="mt-1 wrap-break-word text-xs uppercase tracking-[0.18em] text-(--muted)">{transaction.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <SectionHeader eyebrow="Shopping" title="Shopping summary" description="Everything that needs to be bought or reviewed soon." action={<Button variant="outline" onClick={() => onNavigate('planner')}>Plan shopping</Button>} />
          {insights.shoppingItems.length === 0 ? (
            <EmptyState title="No shopping items" description="Add shopping items to keep the household list connected to the same planning system." />
          ) : (
            <div className="space-y-3">
              {insights.shoppingItems.map((item) => (
                <div key={item.id} className="flex min-w-0 items-center justify-between gap-4 rounded-[1.25rem] border border-(--line) bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="max-w-full wrap-break-word font-semibold text-(--ink)">{item.title}</h4>
                      <Badge color="accent">{item.status}</Badge>
                    </div>
                    <p className="mt-1 wrap-break-word text-sm text-(--muted)">{item.store ?? 'Local store'} · {formatShortDate(item.dueDate)}</p>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="wrap-break-word font-display text-lg font-semibold text-(--ink) sm:text-xl">{formatCurrency(item.amount ?? 0)}</p>
                    <p className="mt-1 wrap-break-word text-xs uppercase tracking-[0.18em] text-(--muted)">Qty {item.quantity ?? 1}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeader eyebrow="Momentum" title="Household pulse" description="A compact summary of what is active right now." />
          <div className="space-y-3">
            <div className="rounded-[1.25rem] border border-(--line) bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-(--muted)">Next due item</span>
                <Badge color="warning">{insights.upcomingPayments[0]?.type ?? '—'}</Badge>
              </div>
              <p className="mt-2 wrap-break-word font-display text-xl font-semibold text-(--ink) sm:text-2xl">{insights.upcomingPayments[0]?.title ?? 'Nothing due'}</p>
              <p className="mt-1 wrap-break-word text-sm text-(--muted)">{formatRelativeDays(insights.upcomingPayments[0]?.dueDate)}</p>
            </div>
            <div className="rounded-[1.25rem] border border-(--line) bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-(--muted)">Most recent transaction</span>
                <Badge color="muted">{transactions[0]?.status ?? '—'}</Badge>
              </div>
              <p className="mt-2 wrap-break-word font-display text-xl font-semibold text-(--ink) sm:text-2xl">{transactions[0]?.title ?? 'No activity yet'}</p>
              <p className="mt-1 wrap-break-word text-sm text-(--muted)">{formatLongDate(transactions[0]?.date)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
