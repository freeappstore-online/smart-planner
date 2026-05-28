import React from 'react'

export function Card({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`glass-panel card-surface ${className}`} {...props}>
      {children}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' | 'subtle' }) {
  const baseStyle = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-50'
  const variants = {
    primary: 'bg-[var(--navy)] text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--navy)_90%,white)]',
    ghost: 'bg-transparent text-[var(--ink)] hover:bg-[var(--line)]',
    danger: 'bg-[var(--error)] text-white hover:-translate-y-0.5 hover:opacity-90',
    outline: 'border border-[var(--line)] bg-transparent text-[var(--ink)] hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] hover:bg-[var(--paper)]/70',
    subtle: 'bg-[var(--paper)]/70 text-[var(--ink)] hover:bg-[var(--line)]',
  }

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Badge({
  children,
  color = 'muted',
}: {
  children: React.ReactNode
  color?: 'success' | 'warning' | 'danger' | 'accent' | 'muted'
}) {
  const colors = {
    success: 'bg-[var(--success)]/12 text-[var(--success)] border-[color-mix(in_srgb,var(--success)_30%,transparent)]',
    warning: 'bg-[var(--warning)]/12 text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_30%,transparent)]',
    danger: 'bg-[var(--error)]/12 text-[var(--error)] border-[color-mix(in_srgb,var(--error)_30%,transparent)]',
    accent: 'bg-[var(--accent)]/12 text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
    muted: 'bg-[var(--line)] text-[var(--muted)] border-[var(--line)]',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] ${colors[color]}`}>
      {children}
    </span>
  )
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full rounded-2xl border border-(--line) bg-white/70 px-4 py-3 text-(--ink) placeholder:text-(--muted) shadow-[0_1px_0_rgba(255,255,255,0.5)] outline-none transition focus:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] focus:ring-4 focus:ring-(--accent)/10 ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`w-full rounded-2xl border border-(--line) bg-white/70 px-4 py-3 text-(--ink) shadow-[0_1px_0_rgba(255,255,255,0.5)] outline-none transition focus:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] focus:ring-4 focus:ring-(--accent)/10 ${className}`} {...props}>{children}</select>
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-30 w-full resize-y rounded-2xl border border-(--line) bg-white/70 px-4 py-3 text-(--ink) placeholder:text-(--muted) shadow-[0_1px_0_rgba(255,255,255,0.5)] outline-none transition focus:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] focus:ring-4 focus:ring-(--accent)/10 ${className}`} {...props} />
}

export function Modal({ isOpen, onClose, title, children, footer }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-4xl border border-white/40 bg-[color-mix(in_srgb,var(--panel)_82%,white)] p-5 shadow-[0_28px_80px_rgba(15,23,42,0.28)] animate-slide-up sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-(--muted)">Smart Planner</p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-(--ink)">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-(--line) bg-white/70 p-3 text-(--muted) transition hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--line))] hover:text-(--ink)">
            ✕
          </button>
        </div>
        {children}
        {footer ? <div className="mt-6 border-t border-(--line) pt-4">{footer}</div> : null}
      </div>
    </div>
  )
}

export function StatCard({ label, value, caption, accent = 'var(--accent)', progress }: { label: string; value: React.ReactNode; caption?: string; accent?: string; progress?: number }) {
  return (
    <Card className="relative min-h-55 overflow-hidden p-5 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent opacity-70" />
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--muted) wrap-break-word">{label}</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <p className="min-w-0 flex-1 wrap-break-word font-display text-[clamp(1.25rem,2.2vw,1.85rem)] font-semibold leading-snug text-(--ink)">{value}</p>
        <span className="mt-1 h-9 w-9 shrink-0 rounded-full border border-(--line)" style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 20%, white))` }} />
      </div>
      {caption ? <p className="mt-3 wrap-break-word text-sm leading-6 text-(--muted)">{caption}</p> : null}
      {typeof progress === 'number' ? (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-(--line)">
            <div className="h-full rounded-full bg-(--navy) transition-[width] duration-500" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
          </div>
        </div>
      ) : null}
    </Card>
  )
}

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-(--muted)">{eyebrow}</p> : null}
        <h3 className="mt-2 wrap-break-word font-display text-2xl font-semibold text-(--ink)">{title}</h3>
        {description ? <p className="mt-2 max-w-2xl wrap-break-word text-sm leading-6 text-(--muted)">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <Card className="flex min-h-55 items-center justify-center text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[linear-gradient(135deg,var(--navy),var(--accent))] opacity-90" />
        <h4 className="font-display text-2xl font-semibold text-(--ink)">{title}</h4>
        <p className="mt-3 text-sm leading-6 text-(--muted)">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </Card>
  )
}

export function MiniBarChart({ bars }: { bars: Array<{ label: string; value: number; accent?: string }> }) {
  const max = Math.max(...bars.map((bar) => bar.value), 1)

  return (
    <div className="grid gap-3">
      {bars.map((bar) => {
        const width = (bar.value / max) * 100
        return (
          <div key={bar.label} className="grid grid-cols-[72px_1fr_56px] items-center gap-3 text-sm">
            <span className="text-(--muted)">{bar.label}</span>
            <div className="h-3 overflow-hidden rounded-full bg-(--line)">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--navy),var(--accent))] transition-[width] duration-500" style={{ width: `${width}%` }} />
            </div>
            <span className="text-right font-semibold text-(--ink)">{bar.value.toFixed(0)}</span>
          </div>
        )
      })}
    </div>
  )
}
