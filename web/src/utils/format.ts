export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatShortDate(value?: string) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatLongDate(value?: string) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

export function formatRelativeDays(value?: string) {
  if (!value) return 'No due date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const millisPerDay = 1000 * 60 * 60 * 24
  const delta = Math.round((date.getTime() - new Date().setHours(0, 0, 0, 0)) / millisPerDay)

  if (delta === 0) return 'Due today'
  if (delta === 1) return 'Due tomorrow'
  if (delta > 1) return `Due in ${delta} days`
  if (delta === -1) return 'Overdue by 1 day'

  return `Overdue by ${Math.abs(delta)} days`
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}