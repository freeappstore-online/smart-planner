import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ProfileMenu } from '@freeappstore/sdk/ui'
import { useAuth } from '@freeappstore/sdk/hooks'
import { fas } from './fas'
import { StoreProvider, useApp } from './store'
import type { AppSection, HubState } from './types'
import { deriveHubInsights } from './utils/hub'
import { formatCurrency, formatPercent } from './utils/format'
import { Button, Card, StatCard, Badge } from './components/ui'
import {
  IconAccounts,
  IconCloud,
  IconDashboard,
  IconGithub,
  IconGoogle,
  IconLock,
  IconMoon,
  IconPayments,
  IconPlanner,
  IconPlannerMark,
  IconSettings,
  IconSun,
  IconWallet,
} from './components/ui/Icons'

const Dashboard = lazy(() => import('./modules/Dashboard').then((module) => ({ default: module.Dashboard })))
const Accounts = lazy(() => import('./modules/Accounts').then((module) => ({ default: module.Accounts })))
const Planner = lazy(() => import('./modules/Planner').then((module) => ({ default: module.Planner })))
const Payments = lazy(() => import('./modules/Payments').then((module) => ({ default: module.Payments })))
const Settings = lazy(() => import('./modules/Settings').then((module) => ({ default: module.Settings })))

const navigation: Array<{ id: AppSection; label: string; icon: ReactNode }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { id: 'accounts', label: 'Accounts', icon: <IconAccounts /> },
  { id: 'planner', label: 'Planner', icon: <IconPlanner /> },
  { id: 'payments', label: 'Payments', icon: <IconPayments /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
]

const CLOUD_KEY = 'smart-planner.backup'

function SectionFallback() {
  return <Card className="min-h-105 animate-pulse bg-white/60" />
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.16),transparent_28%),linear-gradient(180deg,var(--paper),color-mix(in_srgb,var(--paper)_92%,white))] px-4 py-5 sm:px-6 lg:px-8">
      <Card className="mx-auto mt-10 flex min-h-[72vh] max-w-4xl items-center justify-center overflow-hidden border-white/50 bg-white/70 shadow-[0_30px_120px_rgba(15,23,42,0.18)]">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--navy),var(--accent))] text-white shadow-[0_20px_40px_rgba(15,23,42,0.25)]">
            <IconPlannerMark className="h-7 w-7" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-(--muted)">Smart Planner</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-(--ink)">Preparing your household hub</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-(--muted)">Loading your secure session, theme preference, and the shared household workspace.</p>
        </div>
      </Card>
    </div>
  )
}

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      setStatus('Enter an email address to receive a magic link.')
      return
    }

    setStatus('Sending your sign-in link...')
    try {
      await fas.auth.signInWithEmail(email.trim())
      setStatus('Check your inbox for the sign-in link.')
    } catch {
      setStatus('Unable to send the email link right now.')
    }
  }

  return (
    <div className="min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.16),transparent_28%),linear-gradient(180deg,var(--paper),color-mix(in_srgb,var(--paper)_92%,white))] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-40px)] max-w-7xl items-center gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel relative overflow-hidden border-white/50 bg-[color-mix(in_srgb,var(--panel)_86%,white)] p-6 shadow-[0_30px_120px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_32%)]" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--navy),var(--accent))] text-white shadow-[0_20px_40px_rgba(15,23,42,0.26)]">
                <IconPlannerMark className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-(--muted)">Smart Planner</p>
                <h1 className="mt-1 font-display text-4xl font-semibold text-(--ink) sm:text-5xl">Money, planning, and daily rhythm in one place.</h1>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-8 text-(--muted) sm:text-lg">
              Sign in with GitHub or Google, keep your household data organized, and optionally back it up through FreeAppStore&apos;s per-user storage.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => fas.auth.signIn('github')}
                className="inline-flex items-center justify-start gap-3 rounded-3xl bg-[#111827] px-5 py-4 font-semibold text-white shadow-[0_18px_36px_rgba(17,24,39,0.18)] transition hover:bg-[#0b1220]"
              >
                <IconGithub className="h-5 w-5" />
                Continue with GitHub
              </button>
              <button
                type="button"
                onClick={() => fas.auth.signIn('google')}
                className="inline-flex items-center justify-start gap-3 rounded-3xl bg-[linear-gradient(135deg,#2563eb,#06b6d4)] px-5 py-4 font-semibold text-white shadow-[0_18px_36px_rgba(37,99,235,0.18)] transition hover:opacity-95"
              >
                <IconGoogle className="h-5 w-5" />
                Continue with Google
              </button>
              <button
                type="button"
                onClick={handleEmailSignIn}
                className="inline-flex items-center justify-start gap-3 rounded-3xl border border-(--line) bg-white/75 px-5 py-4 font-semibold text-(--ink) shadow-[0_18px_36px_rgba(15,23,42,0.08)] transition hover:bg-white"
              >
                <IconLock className="h-5 w-5" />
                Magic link
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-(--muted)">
              <Badge color="accent">GitHub Login</Badge>
              <Badge color="success">Google Login</Badge>
              <Badge color="warning">Email access</Badge>
              <Badge color="muted">Per-user cloud backup</Badge>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full rounded-3xl border border-(--line) bg-white/80 px-5 py-4 text-(--ink) outline-none transition placeholder:text-(--muted) focus:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] focus:ring-4 focus:ring-(--accent)/10"
              />
              <Button className="rounded-3xl px-6 py-4" onClick={handleEmailSignIn}>Send link</Button>
            </div>

            {status ? <p className="mt-3 text-sm text-(--muted)">{status}</p> : null}
          </div>
        </section>

        <aside className="grid gap-4">
          <Card className="overflow-hidden border-white/50 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--navy)_94%,black),color-mix(in_srgb,var(--accent)_85%,var(--navy)))] p-5 text-white shadow-[0_30px_100px_rgba(15,23,42,0.26)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Household system</p>
                <h2 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">Focused. Calm. Connected.</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <IconWallet className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Accounts</p>
                <p className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">Unified</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Planner</p>
                <p className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">Reusable</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Payments</p>
                <p className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">Tracked</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Backup</p>
                <p className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">Private</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-white/75 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.1)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,#2563eb,#06b6d4)] p-3 text-white"><IconCloud className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-(--ink)">Cloud backup</p>
                  <p className="text-sm text-(--muted)">Per-user KV sync.</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white/75 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.1)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,#10b981,#06b6d4)] p-3 text-white"><IconLock className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-(--ink)">Private login</p>
                  <p className="text-sm text-(--muted)">GitHub, Google, email.</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="bg-white/75 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-(--muted)">What&apos;s inside</p>
            <div className="mt-4 space-y-3 text-sm text-(--muted)">
              <p>Dashboard with balance, spending, shopping, and quick actions.</p>
              <p>One shared account model for checking, savings, and credit cards.</p>
              <p>Planner items and transactions with reusable forms and filters.</p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function HubApp() {
  const { user, loading } = useAuth(fas)
  const { theme, setTheme, accounts, plannerItems, transactions, dashboardWidgets, importData } = useApp()
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'synced' | 'error'>('idle')
  const remoteLoaded = useRef(false)
  const moduleRef = useRef<HTMLElement>(null)

  const insights = useMemo(() => deriveHubInsights({ accounts, plannerItems, transactions }), [accounts, plannerItems, transactions])

  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const resolvedTheme = isDark ? 'dark' : 'light'

    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme

    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', isDark ? '#020617' : '#f8fafc')

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      if (theme === 'system') {
        const nextResolved = event.matches ? 'dark' : 'light'
        document.documentElement.dataset.theme = nextResolved
        document.documentElement.style.colorScheme = nextResolved
      }
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  useEffect(() => {
    remoteLoaded.current = false

    if (!user) {
      setSyncStatus('idle')
      return
    }

    let cancelled = false

    async function loadCloudBackup() {
      setSyncStatus('loading')
      try {
        const backup = await fas.kv.get<HubState>(CLOUD_KEY)
        if (!cancelled && backup) {
          importData(backup)
        }
        if (!cancelled) {
          setSyncStatus('synced')
        }
      } catch {
        if (!cancelled) {
          setSyncStatus('error')
        }
      } finally {
        remoteLoaded.current = true
      }
    }

    void loadCloudBackup()

    return () => {
      cancelled = true
    }
  }, [importData, user])

  useEffect(() => {
    if (!user || !remoteLoaded.current) return

    void fas.kv.set<HubState>(CLOUD_KEY, {
      theme,
      accounts,
      plannerItems,
      transactions,
      dashboardWidgets,
    })
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('error'))
  }, [accounts, dashboardWidgets, plannerItems, theme, transactions, user])

  useEffect(() => {
    moduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeSection])

  const ActiveModule = useMemo(() => {
    switch (activeSection) {
      case 'accounts':
        return <Accounts onNavigate={setActiveSection} />
      case 'planner':
        return <Planner onNavigate={setActiveSection} />
      case 'payments':
        return <Payments onNavigate={setActiveSection} />
      case 'settings':
        return <Settings onNavigate={setActiveSection} />
      case 'dashboard':
      default:
        return <Dashboard onNavigate={setActiveSection} />
    }
  }, [activeSection])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoginScreen />
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar glass-panel">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <IconPlannerMark className="h-6 w-6" />
          </div>
          <div>
            <p className="brand-kicker">Smart Planner</p>
            <h1 className="brand-title">Planner Hub</h1>
          </div>
        </div>

        <Card className="sidebar-summary space-y-1.5 p-4 sm:p-5">
          <p className="summary-label">Welcome back</p>
          <p className="summary-value"><span className="text-[0.52em] align-baseline opacity-60">@</span>{user.login}</p>
          <p className="summary-caption">Signed in with FreeAppStore. Your cloud backup is private to this account.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge color="success">Authenticated</Badge>
            <Badge color={syncStatus === 'synced' ? 'success' : syncStatus === 'loading' ? 'warning' : syncStatus === 'error' ? 'danger' : 'muted'}>
              {syncStatus === 'synced' ? 'Cloud synced' : syncStatus === 'loading' ? 'Syncing' : syncStatus === 'error' ? 'Sync issue' : 'Offline cache'}
            </Badge>
          </div>
        </Card>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          {navigation.map((item) => {
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`sidebar-nav-item ${active ? 'is-active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <Card className="sidebar-footer">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="summary-label">Theme</p>
              <p className="summary-caption">{theme === 'system' ? 'System' : theme}</p>
            </div>
            <div className="flex gap-2">
              <Button variant={theme === 'light' ? 'primary' : 'outline'} className="px-3" onClick={() => setTheme('light')} aria-label="Use light theme">
                <IconSun className="h-4 w-4" />
              </Button>
              <Button variant={theme === 'dark' ? 'primary' : 'outline'} className="px-3" onClick={() => setTheme('dark')} aria-label="Use dark theme">
                <IconMoon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-(--line) bg-[color-mix(in_srgb,var(--panel)_82%,var(--paper))] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--muted)">FreeAppStore profile</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-(--ink)">Connected account</p>
              <ProfileMenu app={fas} showThemeToggle={false} />
            </div>
            <p className="mt-3 text-xs text-(--muted)">Built for <a href="https://freeappstore.online" target="_blank" rel="noopener noreferrer" className="underline">freeappstore.online</a></p>
          </div>
        </Card>
      </aside>

      <main className="app-main">
        <section className="hero-panel glass-panel">
          <div className="hero-copy">
            <p className="hero-kicker">Smart planning workspace</p>
            <h2 className="hero-title">One calm place for money, shopping, bills, and daily structure.</h2>
            <p className="hero-description">
              Designed like a premium planner with reusable account, task, payment, and cloud-backup workflows.
            </p>
            <div className="hero-actions">
              {navigation.map((item) => (
                <Button key={item.id} variant={activeSection === item.id ? 'primary' : 'outline'} onClick={() => setActiveSection(item.id)}>
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="hero-metrics">
            <StatCard label="Available balance" value={formatCurrency(insights.availableBalance)} caption={`${accounts.length} accounts tracked`} accent="#0f172a" />
            <StatCard label="Budget usage" value={formatPercent(insights.budgetUsage * 100)} caption={`${insights.upcomingPayments.length} upcoming commitments`} accent="#06b6d4" progress={insights.budgetUsage * 100} />
          </div>
        </section>

        <section className="module-shell" ref={moduleRef}>
          <Suspense fallback={<SectionFallback />}>{ActiveModule}</Suspense>
        </section>
      </main>

      <nav className="mobile-dock" aria-label="Main Navigation">
        {navigation.map((item) => {
          const active = activeSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`mobile-dock-item ${active ? 'is-active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HubApp />
    </StoreProvider>
  )
}