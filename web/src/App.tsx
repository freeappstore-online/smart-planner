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

function BrandLogo({ className = '', alt = 'Smart Planner logo' }: { className?: string; alt?: string }) {
  return <img src="/logo.png" alt={alt} className={`object-contain ${className}`} />
}

function BrandMark({ className = '', alt = 'Smart Planner icon' }: { className?: string; alt?: string }) {
  return <img src="/icon-192.png" alt={alt} className={`object-contain ${className}`} />
}

function SectionFallback() {
  return <Card className="min-h-105 animate-pulse bg-[color-mix(in_srgb,var(--panel)_84%,var(--paper))]" />
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.16),transparent_28%),linear-gradient(180deg,var(--paper),color-mix(in_srgb,var(--paper)_92%,white))] px-4 py-5 sm:px-6 lg:px-8">
      <Card className="mx-auto mt-10 flex min-h-[72vh] max-w-4xl items-center justify-center overflow-hidden border-(--line) bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] shadow-[0_30px_120px_rgba(15,23,42,0.18)]">
        <div className="text-center">
          <BrandMark className="mx-auto mb-5 h-16 w-16 rounded-3xl shadow-[0_20px_40px_rgba(15,23,42,0.25)] ring-1 ring-white/20" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-(--muted)">Smart Planner</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-(--ink)">Preparing your household hub</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-(--muted)">Loading your secure session, theme preference, and the shared household workspace.</p>
        </div>
      </Card>
    </div>
  )
}

function LoginScreen({ isDark }: { isDark: boolean }) {
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
      <div className="mx-auto grid min-h-[calc(100dvh-40px)] max-w-7xl items-stretch gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)]">
        <section className="glass-panel relative overflow-hidden border-(--line) bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] p-5 shadow-[0_30px_120px_rgba(15,23,42,0.18)] sm:p-7 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="flex flex-col items-start gap-4">
              <BrandLogo className="h-16 w-auto max-w-60 shrink-0" />
              <div className="min-w-0">
                <h1 className="font-display text-4xl font-semibold leading-tight text-(--ink) sm:text-5xl">Money, planning, and daily rhythm in one place.</h1>
              </div>
            </div>

            <p className="max-w-2xl text-base leading-8 text-(--muted) sm:text-lg">
              Sign in with GitHub or Google to keep your household data organized in one clean, focused workspace.
            </p>

            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fas.auth.signIn('github')}
                className="inline-flex w-full max-w-96 items-center justify-start gap-3 rounded-3xl bg-[#111827] px-5 py-4 font-semibold text-white shadow-[0_18px_36px_rgba(17,24,39,0.18)] transition hover:bg-[#0b1220]"
              >
                <IconGithub className="h-5 w-5" />
                Continue with GitHub
              </button>
              <button
                type="button"
                onClick={() => fas.auth.signIn('google')}
                className="inline-flex w-full max-w-96 items-center justify-start gap-3 rounded-3xl bg-[linear-gradient(135deg,#2563eb,#06b6d4)] px-5 py-4 font-semibold text-white shadow-[0_18px_36px_rgba(37,99,235,0.18)] transition hover:opacity-95"
              >
                <IconGoogle className="h-5 w-5" />
                Continue with Google
              </button>
              <button
                type="button"
                onClick={handleEmailSignIn}
                className={isDark
                  ? 'inline-flex w-full max-w-96 items-center justify-start gap-3 rounded-3xl border border-(--line) bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] px-5 py-4 font-semibold text-(--ink) shadow-[0_18px_36px_rgba(15,23,42,0.08)] transition hover:bg-[color-mix(in_srgb,var(--panel)_94%,var(--paper))]'
                  : 'inline-flex w-full max-w-96 items-center justify-start gap-3 rounded-3xl border border-(--line) bg-white px-5 py-4 font-semibold text-navy shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition hover:bg-[color-mix(in_srgb,white_88%,var(--paper))]'
                }
              >
                <IconLock className="h-5 w-5" />
                Magic link
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-(--muted)">
              <Badge color="accent">GitHub Login</Badge>
              <Badge color="success">Google Login</Badge>
              <Badge color="warning">Email access</Badge>
            </div>

            <div className="mx-auto grid w-full max-w-96 gap-3">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full rounded-3xl border border-(--line) bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] px-5 py-4 text-(--ink) outline-none transition placeholder:text-(--muted) focus:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] focus:ring-4 focus:ring-(--accent)/10"
              />
              <Button className="rounded-3xl px-6 py-4" onClick={handleEmailSignIn}>Send link</Button>
            </div>

            {status ? <p className="mt-3 text-sm text-(--muted)">{status}</p> : null}
          </div>
        </section>

        <aside className="grid gap-4">
          <Card
            className={isDark
              ? 'flex h-full flex-col overflow-hidden border-white/50 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--navy)_94%,black),color-mix(in_srgb,var(--accent)_85%,var(--navy)))] p-4 text-white shadow-[0_30px_100px_rgba(15,23,42,0.26)] sm:p-5'
              : 'flex h-full flex-col overflow-hidden border-(--line) bg-[linear-gradient(145deg,color-mix(in_srgb,var(--paper)_96%,white),color-mix(in_srgb,var(--accent)_12%,var(--paper)))] p-4 text-navy shadow-[0_30px_100px_rgba(15,23,42,0.12)] sm:p-5'
            }
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)]">
              <div>
                <p className={isDark ? 'text-xs font-semibold uppercase tracking-[0.24em] text-white/65' : 'text-xs font-semibold uppercase tracking-[0.24em] text-slate-600'}>Household system</p>
                <h2 className={isDark ? 'mt-2 font-display text-xl font-semibold leading-tight sm:text-2xl text-white' : 'mt-2 font-display text-xl font-semibold leading-tight sm:text-2xl text-navy'}>Focused. Calm. Connected.</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <div className={isDark ? 'rounded-3xl border border-white/10 bg-white/10 p-3.5 backdrop-blur' : 'rounded-3xl border border-(--line) bg-white/75 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]'}>
                <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-white/60' : 'text-xs uppercase tracking-[0.2em] text-slate-600'}>Accounts</p>
                <p className={isDark ? 'mt-1.5 font-display text-xl font-semibold leading-tight sm:text-2xl text-white' : 'mt-1.5 font-display text-xl font-semibold leading-tight sm:text-2xl text-navy'}>Unified</p>
              </div>
              <div className={isDark ? 'rounded-3xl border border-white/10 bg-white/10 p-3.5 backdrop-blur' : 'rounded-3xl border border-(--line) bg-white/75 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]'}>
                <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-white/60' : 'text-xs uppercase tracking-[0.2em] text-slate-600'}>Planner</p>
                <p className={isDark ? 'mt-1.5 font-display text-xl font-semibold leading-tight sm:text-2xl text-white' : 'mt-1.5 font-display text-xl font-semibold leading-tight sm:text-2xl text-navy'}>Reusable</p>
              </div>
              <div className={isDark ? 'rounded-3xl border border-white/10 bg-white/10 p-3.5 backdrop-blur' : 'rounded-3xl border border-(--line) bg-white/75 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]'}>
                <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-white/60' : 'text-xs uppercase tracking-[0.2em] text-slate-600'}>Payments</p>
                <p className={isDark ? 'mt-1.5 font-display text-xl font-semibold leading-tight sm:text-2xl text-white' : 'mt-1.5 font-display text-xl font-semibold leading-tight sm:text-2xl text-navy'}>Tracked</p>
              </div>
              <div className={isDark ? 'rounded-3xl border border-white/10 bg-white/10 p-3.5 backdrop-blur' : 'rounded-3xl border border-(--line) bg-white/75 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]'}>
                <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-white/60' : 'text-xs uppercase tracking-[0.2em] text-slate-600'}>Backup</p>
                <p className={isDark ? 'mt-1.5 font-display text-xl font-semibold leading-tight sm:text-2xl text-white' : 'mt-1.5 font-display text-xl font-semibold leading-tight sm:text-2xl text-navy'}>Private</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.1)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,#2563eb,#06b6d4)] p-3 text-white"><IconCloud className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-(--ink)">Secure data</p>
                  <p className="text-sm text-(--muted)">Local-first and private by default.</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.1)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,#10b981,#06b6d4)] p-3 text-white"><IconLock className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-(--ink)">Private login</p>
                  <p className="text-sm text-(--muted)">GitHub, Google, email.</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.1)]">
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
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    return <LoginScreen isDark={isDark} />
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
          <p className="summary-caption">Signed in with FreeAppStore. Your workspace stays private and secure.</p>
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
        <div className="mt-auto pt-4 text-center">
          <a
            href="https://freeappstore.online"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-(--muted) transition hover:text-(--accent)"
          >
            Built for freeappstore.online
          </a>
        </div>
      </aside>

      <main className="app-main">
        <header className="glass-panel mb-4 flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
          <BrandLogo className="h-9 w-auto max-w-45 shrink-0" />

          <nav className="hidden min-w-0 flex-wrap items-center gap-2 lg:flex" aria-label="Top Navigation">
            {navigation.map((item) => (
              <Button
                key={`top-${item.id}`}
                variant={activeSection === item.id ? 'primary' : 'outline'}
                className="h-9 px-4 text-xs"
                onClick={() => setActiveSection(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant={theme === 'light' ? 'primary' : 'outline'} className="h-9 w-9 rounded-full px-0" onClick={() => setTheme('light')} aria-label="Use light theme">
              <IconSun className="h-4 w-4" />
            </Button>
            <Button variant={theme === 'dark' ? 'primary' : 'outline'} className="h-9 w-9 rounded-full px-0" onClick={() => setTheme('dark')} aria-label="Use dark theme">
              <IconMoon className="h-4 w-4" />
            </Button>
            <Button variant={theme === 'system' ? 'primary' : 'outline'} className="h-9 w-9 rounded-full px-0" onClick={() => setTheme('system')} aria-label="Use system theme">
              <IconSettings className="h-4 w-4" />
            </Button>

            <ProfileMenu app={fas} showThemeToggle={true} />

            <details className="relative lg:hidden">
              <summary className="list-none rounded-full border border-(--line) bg-[color-mix(in_srgb,var(--panel)_88%,var(--paper))] px-3 py-2 text-xs font-semibold text-(--ink) hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))]">
                Menu
              </summary>
              <div className="absolute right-0 z-50 mt-2 min-w-44 rounded-2xl border border-(--line) bg-[color-mix(in_srgb,var(--panel)_94%,var(--paper))] p-2 shadow-[0_16px_36px_rgba(15,23,42,0.2)] backdrop-blur">
                {navigation.map((item) => (
                  <button
                    key={`mobile-top-${item.id}`}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${activeSection === item.id ? 'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-(--ink)' : 'text-(--muted) hover:bg-(--line)'}`}
                  >
                    <span className="h-4 w-4">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </details>
          </div>
        </header>

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