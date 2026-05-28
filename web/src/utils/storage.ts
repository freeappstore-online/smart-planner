import type { HubState } from '../types'
import { createSeedState, normalizeAccount, normalizePlannerItem, normalizeTransaction, normalizeWidget } from './hub'

const STORAGE_KEY = 'smart-planner.hub.v2'
const THEME_KEY = 'smart-planner.theme'
const LEGACY_KEYS = ['smart-planner.hub.v1', 'smart-planner.state']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeTheme(value: unknown): HubState['theme'] {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

export function normalizeHubState(value: unknown): HubState | null {
  if (!isRecord(value)) return null

  const seed = createSeedState()

  const accounts = Array.isArray(value.accounts)
    ? value.accounts.map((entry) => normalizeAccount(entry)).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : seed.accounts
  const plannerItems = Array.isArray(value.plannerItems)
    ? value.plannerItems.map((entry) => normalizePlannerItem(entry)).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : seed.plannerItems
  const transactions = Array.isArray(value.transactions)
    ? value.transactions.map((entry) => normalizeTransaction(entry, seed.accounts[0]?.id ?? 'account-checking')).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : seed.transactions
  const dashboardWidgets = Array.isArray(value.dashboardWidgets)
    ? value.dashboardWidgets.map((entry) => normalizeWidget(entry)).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : seed.dashboardWidgets

  return {
    theme: normalizeTheme(value.theme),
    accounts,
    plannerItems,
    transactions,
    dashboardWidgets,
  } as HubState
}

export function loadHubState() {
  if (typeof window === 'undefined') return createSeedState()

  const rawTheme = window.localStorage.getItem(THEME_KEY)

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY)
    if (rawState) {
      const parsed = normalizeHubState(JSON.parse(rawState))
      if (parsed) {
        return rawTheme ? { ...parsed, theme: normalizeTheme(rawTheme) } : parsed
      }
    }

    for (const legacyKey of LEGACY_KEYS) {
      const legacyRaw = window.localStorage.getItem(legacyKey)
      if (!legacyRaw) continue

      const parsed = normalizeHubState(JSON.parse(legacyRaw))
      if (parsed) {
        return rawTheme ? { ...parsed, theme: normalizeTheme(rawTheme) } : parsed
      }
    }
  } catch {
    return createSeedState()
  }

  const seed = createSeedState()
  return rawTheme ? { ...seed, theme: normalizeTheme(rawTheme) } : seed
}

export function saveHubState(state: HubState) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.localStorage.setItem(THEME_KEY, state.theme)
}

export function exportHubState(state: HubState) {
  if (typeof window === 'undefined') return

  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'smart-planner-backup.json'
  link.click()
  URL.revokeObjectURL(url)
}

export function themeStorageKey() {
  return THEME_KEY
}
