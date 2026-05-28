import { useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import type { AppSection, HubState, ThemeMode } from '../types'
import { useApp } from '../store'
import { Badge, Button, Card, SectionHeader } from '../components/ui'
import { IconCloud, IconDownload, IconMoon, IconReset, IconSun, IconUpload } from '../components/ui/Icons'
import { fas } from '../fas'
import { useAuth } from '@freeappstore/sdk/hooks'

type ModuleProps = {
  onNavigate: (section: AppSection) => void
}

const themeModes: Array<{ id: ThemeMode; label: string; icon: ReactNode; description: string }> = [
  { id: 'light', label: 'Light', icon: <IconSun className="h-4 w-4" />, description: 'Bright, airy, and crisp' },
  { id: 'dark', label: 'Dark', icon: <IconMoon className="h-4 w-4" />, description: 'Low-light, focused, and refined' },
  { id: 'system', label: 'System', icon: <IconReset className="h-4 w-4" />, description: 'Follow the operating system' },
]

export function Settings({ onNavigate }: ModuleProps) {
  const { theme, setTheme, resetApp, exportData, importData, accounts, plannerItems, transactions, dashboardWidgets } = useApp()
  const { user, signIn } = useAuth(fas)
  const importRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')
  const [cloudStatus, setCloudStatus] = useState('')

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const parsed = JSON.parse(await file.text())
      importData(parsed)
      setStatus('Backup imported successfully.')
    } catch {
      setStatus('The selected backup file could not be read.')
    }

    if (importRef.current) {
      importRef.current.value = ''
    }
  }

  function handleReset() {
    if (window.confirm('Reset the app and restore the starter household data?')) {
      resetApp()
      setStatus('App reset to the starter dataset.')
    }
  }

  async function saveCloudBackup() {
    if (!user) {
      setCloudStatus('Sign in first to enable cloud backup.')
      return
    }

    try {
      await fas.kv.set<HubState>('smart-planner.backup', {
        theme,
        accounts,
        plannerItems,
        transactions,
        dashboardWidgets,
      })
      setCloudStatus('Saved to your FreeAppStore cloud backup.')
    } catch {
      setCloudStatus('Cloud backup could not be saved right now.')
    }
  }

  async function restoreCloudBackup() {
    if (!user) {
      setCloudStatus('Sign in first to restore a cloud backup.')
      return
    }

    try {
      const backup = await fas.kv.get<HubState>('smart-planner.backup')
      if (!backup) {
        setCloudStatus('No cloud backup was found for this account.')
        return
      }

      importData(backup)
      setCloudStatus('Cloud backup restored into the app.')
    } catch {
      setCloudStatus('Cloud backup could not be restored right now.')
    }
  }

  return (
    <div className="module-stack">
      <SectionHeader eyebrow="Settings" title="Minimal control panel" description="Keep the app local, private, and easy to recover." action={<Button variant="outline" onClick={() => onNavigate('dashboard')}>Back to dashboard</Button>} />

      <div className="grid gap-4 xl:grid-cols-3">
        {themeModes.map((mode) => (
          <Card key={mode.id} className={`setting-preview flex h-full min-h-55 flex-col overflow-hidden p-6 sm:p-7 ${theme === mode.id ? 'is-active' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--muted)">Theme preview</p>
                <h3 className="mt-2 wrap-break-word font-display text-2xl font-semibold text-(--ink)">{mode.label}</h3>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-(--line) bg-white/80 text-(--navy)">{mode.icon}</div>
            </div>
            <p className="mt-3 min-w-0 wrap-break-word text-sm leading-6 text-(--muted)">{mode.description}</p>
            <Button className="mt-auto w-full" variant={theme === mode.id ? 'primary' : 'outline'} onClick={() => setTheme(mode.id)}>
              Apply {mode.label}
            </Button>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-6 sm:p-7">
          <SectionHeader eyebrow="Backup" title="Local and cloud data management" description="Export/import offline data or use your FreeAppStore account to save a private per-user cloud backup." />
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportData}><IconDownload className="h-4 w-4" />Export backup</Button>
            <Button variant="outline" onClick={() => importRef.current?.click()}><IconUpload className="h-4 w-4" />Import backup</Button>
            <Button variant="danger" onClick={handleReset}><IconReset className="h-4 w-4" />Reset app</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={saveCloudBackup}><IconCloud className="h-4 w-4" />Save cloud backup</Button>
            <Button variant="outline" onClick={restoreCloudBackup}><IconCloud className="h-4 w-4" />Restore cloud backup</Button>
          </div>
          {!user ? <Button className="mt-4" onClick={() => signIn()}><IconCloud className="h-4 w-4" />Sign in for cloud backup</Button> : null}
          <input ref={importRef} className="hidden" type="file" accept="application/json" onChange={handleImport} />
          <p className="mt-5 wrap-break-word text-sm leading-6 text-(--muted)">{status || 'Your data lives entirely in localStorage and the app can be recovered from a single JSON backup.'}</p>
          {cloudStatus ? <p className="mt-3 wrap-break-word text-sm leading-6 text-(--muted)">{cloudStatus}</p> : null}
        </Card>

        <Card className="p-6 sm:p-7">
          <SectionHeader eyebrow="Privacy" title="What stays local" description="The product is intentionally offline-first and avoids remote tracking surfaces." />
          <div className="space-y-3 text-sm leading-6 text-(--muted)">
            <p className="wrap-break-word">Local cache remains available offline. FreeAppStore authentication and per-user KV backup are optional.</p>
            <p className="wrap-break-word">No cookies, analytics, or external images.</p>
            <p className="wrap-break-word">Starter data helps new users understand the product immediately and can be replaced or reset at any time.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge color="muted">{accounts.length} accounts</Badge>
            <Badge color="muted">{plannerItems.length} planner items</Badge>
            <Badge color="muted">{transactions.length} transactions</Badge>
          </div>
        </Card>
      </div>
    </div>
  )
}
