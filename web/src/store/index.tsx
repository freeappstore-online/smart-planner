import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type {
  Account,
  HubState,
  PlannerItem,
  ThemeMode,
  Transaction,
} from '../types'
import { createSeedState } from '../utils/hub'
import { exportHubState, loadHubState, normalizeHubState, saveHubState } from '../utils/storage'

export const defaultState: HubState = createSeedState()

type HubContextValue = HubState & {
  setTheme: (theme: ThemeMode) => void
  resetApp: () => void
  importData: (data: HubState) => void
  exportData: () => void
  upsertAccount: (account: Account) => void
  deleteAccount: (id: string) => void
  upsertPlannerItem: (item: PlannerItem) => void
  deletePlannerItem: (id: string) => void
  upsertTransaction: (transaction: Transaction) => void
  deleteTransaction: (id: string) => void
  setState: (state: HubState) => void
}

const HubContext = createContext<HubContextValue | null>(null)

function mergeById<T extends { id: string }>(items: T[], next: T) {
  const index = items.findIndex((item) => item.id === next.id)
  if (index === -1) return [...items, next]

  return items.map((item) => (item.id === next.id ? next : item))
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<HubState>(defaultState)
  const isLoaded = useRef(false)

  useEffect(() => {
    const stored = loadHubState()
    const normalized = normalizeHubState(stored) ?? stored
    setState(normalized)
    isLoaded.current = true
  }, [])

  useEffect(() => {
    if (!isLoaded.current) return
    saveHubState(state)
  }, [state])

  const value = useMemo<HubContextValue>(() => {
    const updateState = (next: HubState) => setState(next)

    return {
      ...state,
      setTheme: (theme: ThemeMode) => setState((previous) => ({ ...previous, theme })),
      resetApp: () => setState(defaultState),
      importData: (data: HubState) => setState(data),
      exportData: () => exportHubState(state),
      upsertAccount: (account: Account) => setState((previous) => ({
        ...previous,
        accounts: mergeById(previous.accounts, account),
      })),
      deleteAccount: (id: string) => setState((previous) => ({
        ...previous,
        accounts: previous.accounts.filter((account) => account.id !== id),
      })),
      upsertPlannerItem: (item: PlannerItem) => setState((previous) => ({
        ...previous,
        plannerItems: mergeById(previous.plannerItems, item),
      })),
      deletePlannerItem: (id: string) => setState((previous) => ({
        ...previous,
        plannerItems: previous.plannerItems.filter((item) => item.id !== id),
      })),
      upsertTransaction: (transaction: Transaction) => setState((previous) => ({
        ...previous,
        transactions: mergeById(previous.transactions, transaction),
      })),
      deleteTransaction: (id: string) => setState((previous) => ({
        ...previous,
        transactions: previous.transactions.filter((transaction) => transaction.id !== id),
      })),
      setState: updateState,
    }
  }, [state])

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>
}

export function useApp() {
  const ctx = useContext(HubContext)
  if (!ctx) throw new Error('useApp must be used within StoreProvider')
  return ctx
}

export function useAccounts() {
  const { accounts, upsertAccount, deleteAccount } = useApp()
  return { accounts, upsertAccount, deleteAccount }
}

export function usePlanner() {
  const { plannerItems, upsertPlannerItem, deletePlannerItem } = useApp()
  return { items: plannerItems, upsertPlannerItem, deletePlannerItem }
}

export function useTransactions() {
  const { transactions, upsertTransaction, deleteTransaction } = useApp()
  return { transactions, upsertTransaction, deleteTransaction }
}
