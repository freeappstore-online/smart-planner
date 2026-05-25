import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { initApp } from '@freeappstore/sdk'
import { SignInButton } from '@freeappstore/sdk/ui'
import { visualById, visualLibrary } from './utils/visuals'
import type {
  PlannerHabit,
  PlannerNote,
  PlannerState,
  PlannerTask,
  Priority,
  ShoppingItem,
  TaskArea,
  ThemeMode,
} from './types'

const fas = initApp({ appId: 'smart-planner' })
const STORAGE_KEY = 'smart-planner.state'

const today = () => new Date().toISOString().slice(0, 10)

const menuItems = [
  { label: 'Overview', target: 'hero' },
  { label: 'Tasks', target: 'tasks' },
  { label: 'Habits', target: 'habits' },
  { label: 'Notes', target: 'notes' },
  { label: 'Shopping', target: 'shopping' },
  { label: 'Inspiration', target: 'inspiration' },
  { label: 'Theme', target: 'theme' },
  { label: 'Backup', target: 'backup' },
]

const minFontScale = 0.9
const maxFontScale = 1.12
const fontScaleStep = 0.04

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

const defaultState: PlannerState = {
  theme: 'system',
  featuredVisualId: 'workspace',
  tasks: [
    {
      id: 'task-1',
      title: 'Plan the week',
      note: 'Set priorities before the day starts.',
      due: today(),
      area: 'Work',
      priority: 'High',
      done: false,
    },
    {
      id: 'task-2',
      title: 'Finish creative sprint',
      note: 'Keep the focused block protected.',
      due: today(),
      area: 'Personal',
      priority: 'Medium',
      done: true,
    },
    {
      id: 'task-3',
      title: 'Review room layout ideas',
      note: 'Capture what can be simplified.',
      due: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      area: 'Home',
      priority: 'Low',
      done: false,
    },
  ],
  habits: [
    { id: 'habit-1', title: 'Morning stretch', cadence: 'Daily', streak: 9, doneToday: true },
    { id: 'habit-2', title: '10-minute reading', cadence: 'Daily', streak: 4, doneToday: false },
    { id: 'habit-3', title: 'Weekly reset', cadence: 'Sunday', streak: 12, doneToday: true },
  ],
  notes: [
    {
      id: 'note-1',
      title: 'Design direction',
      body: 'Use warm neutrals, soft glass, and deep accent gradients.',
      tag: 'Style',
      favorite: true,
    },
    {
      id: 'note-2',
      title: 'Grocery list',
      body: 'Coffee beans, berries, oats, sparkling water.',
      tag: 'Home',
      favorite: false,
    },
  ],
  shopping: [
    { id: 'shop-1', name: 'Coffee beans', quantity: 2, store: 'Market', done: false },
    { id: 'shop-2', name: 'Desk lamp bulb', quantity: 1, store: 'Hardware', done: true },
  ],
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function isPriority(value: unknown): value is Priority {
  return value === 'Low' || value === 'Medium' || value === 'High'
}

function isTaskArea(value: unknown): value is TaskArea {
  return value === 'Work' || value === 'Home' || value === 'Personal' || value === 'Wellness'
}

function normalizeState(candidate: Partial<PlannerState> | null | undefined): PlannerState {
  if (!candidate) {
    return defaultState
  }

  return {
    theme: isThemeMode(candidate.theme) ? candidate.theme : defaultState.theme,
    featuredVisualId:
      visualLibrary.some((visual) => visual.id === candidate.featuredVisualId)
        ? candidate.featuredVisualId ?? defaultState.featuredVisualId
        : defaultState.featuredVisualId,
    tasks: Array.isArray(candidate.tasks)
      ? candidate.tasks.filter(
          (task): task is PlannerTask => Boolean(task?.id && task?.title && isPriority(task.priority) && isTaskArea(task.area)),
        )
      : defaultState.tasks,
    habits: Array.isArray(candidate.habits)
      ? candidate.habits.filter((habit): habit is PlannerHabit => Boolean(habit?.id && habit?.title))
      : defaultState.habits,
    notes: Array.isArray(candidate.notes)
      ? candidate.notes.filter((note): note is PlannerNote => Boolean(note?.id && note?.title))
      : defaultState.notes,
    shopping: Array.isArray(candidate.shopping)
      ? candidate.shopping.filter((item): item is ShoppingItem => Boolean(item?.id && item?.name))
      : defaultState.shopping,
  }
}

function loadPlannerState(): PlannerState {
  if (typeof window === 'undefined') {
    return defaultState
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return defaultState
    }

    return normalizeState(JSON.parse(stored) as Partial<PlannerState>)
  } catch {
    return defaultState
  }
}

function formatPriority(priority: Priority) {
  return priority === 'High' ? 'Urgent' : priority
}

function statTone(value: number) {
  if (value >= 80) {
    return 'var(--success)'
  }

  if (value >= 50) {
    return 'var(--warning)'
  }

  return 'var(--error)'
}

function AppShellContent() {
  const [state, setState] = useState<PlannerState>(loadPlannerState)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [fontScale, setFontScale] = useState(() => {
    if (typeof window === 'undefined') {
      return 1
    }

    const stored = window.localStorage.getItem('smart-planner.fontScale')
    const parsed = stored ? Number.parseFloat(stored) : 1
    return Number.isFinite(parsed) ? Math.min(maxFontScale, Math.max(minFontScale, parsed)) : 1
  })
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [taskDraft, setTaskDraft] = useState({
    title: '',
    note: '',
    due: today(),
    area: 'Work' as TaskArea,
    priority: 'Medium' as Priority,
  })
  const [habitDraft, setHabitDraft] = useState({ title: '', cadence: 'Daily' })
  const [noteDraft, setNoteDraft] = useState({ title: '', body: '', tag: 'Focus' })
  const [shoppingDraft, setShoppingDraft] = useState({ name: '', quantity: 1, store: 'Market' })
  const importRef = useRef<HTMLInputElement | null>(null)
  const tasksImportRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    window.localStorage.setItem('smart-planner.fontScale', String(fontScale))
    document.documentElement.style.setProperty('--font-scale', String(fontScale))
  }, [fontScale])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(media.matches)

    onChange()
    media.addEventListener('change', onChange)

    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme = state.theme === 'system' ? (systemDark ? 'dark' : 'light') : state.theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme === 'dark' ? 'dark' : 'light'
    const themeColor = resolvedTheme === 'dark' ? '#111018' : '#f5efe6'
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', themeColor)
    }
    document.documentElement.style.background = themeColor
  }, [resolvedTheme])

  const stats = useMemo(() => {
    const completedTasks = state.tasks.filter((task) => task.done).length
    const taskProgress = state.tasks.length ? Math.round((completedTasks / state.tasks.length) * 100) : 0
    const habitsDone = state.habits.filter((habit) => habit.doneToday).length
    const shoppingLeft = state.shopping.filter((item) => !item.done).length
    const favoriteNotes = state.notes.filter((note) => note.favorite).length
    const nextTask = state.tasks.find((task) => !task.done) ?? state.tasks[0]
    const topStreak = state.habits.reduce((max, habit) => Math.max(max, habit.streak), 0)

    return { completedTasks, taskProgress, habitsDone, shoppingLeft, favoriteNotes, nextTask, topStreak }
  }, [state])

  const selectedVisual = visualById(state.featuredVisualId)

  function setTheme(theme: ThemeMode) {
    setState((current) => ({ ...current, theme }))
  }

  function adjustFontScale(delta: number) {
    setFontScale((current) => Math.min(maxFontScale, Math.max(minFontScale, Number((current + delta).toFixed(2)))))
  }

  function jumpTo(target: string) {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileMenuOpen(false)
  }

  function toggleTaskDone(id: string) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }))
  }

  function removeTask(id: string) {
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }))
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!taskDraft.title.trim()) {
      return
    }

    setState((current) => ({
      ...current,
      tasks: [
        {
          id: createId('task'),
          title: taskDraft.title.trim(),
          note: taskDraft.note.trim(),
          due: taskDraft.due || today(),
          area: taskDraft.area,
          priority: taskDraft.priority,
          done: false,
        },
        ...current.tasks,
      ],
    }))

    setTaskDraft({ title: '', note: '', due: today(), area: 'Work', priority: 'Medium' })
  }

  function toggleHabit(id: string) {
    setState((current) => ({
      ...current,
      habits: current.habits.map((habit) =>
        habit.id === id
          ? { ...habit, doneToday: !habit.doneToday, streak: habit.doneToday ? Math.max(0, habit.streak - 1) : habit.streak + 1 }
          : habit,
      ),
    }))
  }

  function addHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!habitDraft.title.trim()) {
      return
    }

    setState((current) => ({
      ...current,
      habits: [
        {
          id: createId('habit'),
          title: habitDraft.title.trim(),
          cadence: habitDraft.cadence.trim() || 'Daily',
          streak: 0,
          doneToday: false,
        },
        ...current.habits,
      ],
    }))

    setHabitDraft({ title: '', cadence: 'Daily' })
  }

  function toggleNoteFavorite(id: string) {
    setState((current) => ({
      ...current,
      notes: current.notes.map((note) => (note.id === id ? { ...note, favorite: !note.favorite } : note)),
    }))
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!noteDraft.title.trim() && !noteDraft.body.trim()) {
      return
    }

    setState((current) => ({
      ...current,
      notes: [
        {
          id: createId('note'),
          title: noteDraft.title.trim() || 'Untitled note',
          body: noteDraft.body.trim(),
          tag: noteDraft.tag.trim() || 'Focus',
          favorite: false,
        },
        ...current.notes,
      ],
    }))

    setNoteDraft({ title: '', body: '', tag: 'Focus' })
  }

  function addShoppingItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!shoppingDraft.name.trim()) {
      return
    }

    setState((current) => ({
      ...current,
      shopping: [
        {
          id: createId('shop'),
          name: shoppingDraft.name.trim(),
          quantity: Math.max(1, Math.round(shoppingDraft.quantity)),
          store: shoppingDraft.store.trim() || 'Market',
          done: false,
        },
        ...current.shopping,
      ],
    }))

    setShoppingDraft({ name: '', quantity: 1, store: 'Market' })
  }

  function adjustShoppingQuantity(id: string, delta: number) {
    setState((current) => ({
      ...current,
      shopping: current.shopping.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item,
      ),
    }))
  }

  function toggleShoppingDone(id: string) {
    setState((current) => ({
      ...current,
      shopping: current.shopping.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    }))
  }

  function removeShoppingItem(id: string) {
    setState((current) => ({ ...current, shopping: current.shopping.filter((item) => item.id !== id) }))
  }

  function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'smart-planner-backup.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportTasks() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: state.tasks,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'smart-planner-tasks.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importState(file: File) {
    const text = await file.text()
    const parsed = JSON.parse(text) as Partial<PlannerState>
    setState(normalizeState(parsed))
  }

  async function importTasks(file: File) {
    const text = await file.text()
    const parsed = JSON.parse(text) as Partial<{ tasks: PlannerTask[] }>
    const importedTasks = Array.isArray(parsed.tasks) ? parsed.tasks : []

    if (!importedTasks.length) {
      return
    }

    setState((current) => ({
      ...current,
      tasks: importedTasks.filter(
        (task): task is PlannerTask => Boolean(task?.id && task?.title && isPriority(task.priority) && isTaskArea(task.area)),
      ),
    }))
  }

  function resetPlanner() {
    setState(defaultState)
  }

  return (
      <main className="planner-shell">
        <div className="planner-page space-y-6 pb-8">
          <header className="menu-bar surface" aria-label="Smart Planner navigation">
            <button className="menu-brand" type="button" onClick={() => jumpTo('hero')}>
              Smart Planner
            </button>

            <div className="menu-links" aria-label="Smart Planner sections">
              {menuItems.map((item) => (
                <button key={item.target} className="menu-button" type="button" onClick={() => jumpTo(item.target)}>
                  {item.label}
                </button>
              ))}
              <button className="menu-button menu-jump" type="button" onClick={() => jumpTo('bottom')} aria-label="Jump to bottom">
                ↓
              </button>
            </div>

            <div className="menu-actions">
              <button className="theme-button size-button" type="button" onClick={() => adjustFontScale(-fontScaleStep)} aria-label="Decrease text size">
                A−
              </button>
              <button className="theme-button size-button" type="button" onClick={() => adjustFontScale(fontScaleStep)} aria-label="Increase text size">
                A+
              </button>
              <button className="theme-button" type="button" onClick={() => setTheme('light')} aria-pressed={state.theme === 'light'}>
                Light
              </button>
              <button className="theme-button" type="button" onClick={() => setTheme('dark')} aria-pressed={state.theme === 'dark'}>
                Dark
              </button>
              <div className="auth-button-wrap">
                <SignInButton app={fas} label="Sign in" />
              </div>
              <button
                className="hamburger-button"
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMobileMenuOpen((current) => !current)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="mobile-menu" id="mobile-menu">
                <div className="mobile-menu-grid">
                  {menuItems.map((item) => (
                    <button key={item.target} className="mobile-menu-item" type="button" onClick={() => jumpTo(item.target)}>
                      {item.label}
                    </button>
                  ))}
                  <button className="mobile-menu-item accent" type="button" onClick={() => jumpTo('bottom')}>
                    ↓
                  </button>
                  <button className="mobile-menu-item" type="button" onClick={() => adjustFontScale(-fontScaleStep)}>
                    A−
                  </button>
                  <button className="mobile-menu-item" type="button" onClick={() => adjustFontScale(fontScaleStep)}>
                    A+
                  </button>
                  <button className="mobile-menu-item" type="button" onClick={() => setTheme('light')}>
                    Light mode
                  </button>
                  <button className="mobile-menu-item" type="button" onClick={() => setTheme('dark')}>
                    Dark mode
                  </button>
                </div>
              </div>
            )}
          </header>

          <section className="surface rounded-4xl p-5 md:p-6" id="hero">
            <div className="hero-grid">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge">Smart Planner</span>
                  <span className="planner-chip">Offline-first</span>
                  <span className="planner-chip">No backend</span>
                  <span className="planner-chip">Local storage</span>
                </div>
                <div className="space-y-3">
                  <p className="section-kicker">Premium planning, fully local</p>
                  <h1 className="app-title">Design your day with calm structure.</h1>
                  <p className="max-w-xl text-base leading-7 text-(--muted)">
                    Smart Planner keeps your tasks, habits, notes, shopping list, and inspiration in one offline workspace.
                    Everything stays on this device.
                  </p>
                </div>
                <div className="row-actions">
                  <button className="planner-button" type="button" onClick={() => document.getElementById('tasks')?.scrollIntoView({ behavior: 'smooth' })}>
                    Open tasks
                  </button>
                  <button className="planner-button ghost" type="button" onClick={exportState}>
                    Export backup
                  </button>
                </div>
                <div className="stat-grid pt-1">
                  <div className="stat-card">
                    <div className="text-sm text-(--muted)">Task progress</div>
                    <div className="mt-2 text-3xl font-semibold">{stats.taskProgress}%</div>
                    <div className="mt-2 h-2 rounded-full bg-black/10">
                      <div className="h-2 rounded-full" style={{ width: `${stats.taskProgress}%`, background: statTone(stats.taskProgress) }} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-sm text-(--muted)">Habits done</div>
                    <div className="mt-2 text-3xl font-semibold">{stats.habitsDone}</div>
                    <div className="mt-2 text-sm text-(--muted)">Best streak {stats.topStreak} days</div>
                  </div>
                  <div className="stat-card">
                    <div className="text-sm text-(--muted)">Shopping left</div>
                    <div className="mt-2 text-3xl font-semibold">{stats.shoppingLeft}</div>
                    <div className="mt-2 text-sm text-(--muted)">{state.shopping.length} items total</div>
                  </div>
                  <div className="stat-card">
                    <div className="text-sm text-(--muted)">Favorite notes</div>
                    <div className="mt-2 text-3xl font-semibold">{stats.favoriteNotes}</div>
                    <div className="mt-2 text-sm text-(--muted)">{selectedVisual.title}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="hero-visual surface">
                  <img src={selectedVisual.src} alt={selectedVisual.title} />
                </div>
                <div className="surface rounded-[28px] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="section-kicker">Today</p>
                      <h2 className="mt-2 text-2xl">{stats.nextTask?.title ?? 'No tasks left'}</h2>
                      <p className="mt-2 text-sm leading-6 text-(--muted)">{stats.nextTask?.note || 'Take a quiet reset and choose the next move.'}</p>
                    </div>
                    <span className="badge muted">{stats.completedTasks} done</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="card-grid cols-2">
            <div className="planner-card" id="tasks">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">Tasks</p>
                  <h2 className="mt-2 text-2xl">Plan the work</h2>
                </div>
                <span className="badge muted">{state.tasks.length} items</span>
              </div>

              <form className="mt-4 grid gap-3" onSubmit={addTask}>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="planner-input"
                    placeholder="Task title"
                    value={taskDraft.title}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))}
                  />
                  <input
                    className="planner-input"
                    type="date"
                    value={taskDraft.due}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, due: event.target.value }))}
                  />
                </div>
                <textarea
                  className="planner-textarea"
                  placeholder="Short note or next step"
                  value={taskDraft.note}
                  onChange={(event) => setTaskDraft((current) => ({ ...current, note: event.target.value }))}
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <select
                    className="planner-select"
                    value={taskDraft.area}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, area: event.target.value as TaskArea }))}
                  >
                    <option>Work</option>
                    <option>Home</option>
                    <option>Personal</option>
                    <option>Wellness</option>
                  </select>
                  <select
                    className="planner-select"
                    value={taskDraft.priority}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, priority: event.target.value as Priority }))}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                  <button className="planner-button" type="submit">Add task</button>
                </div>
              </form>

              <div className="item-list mt-5">
                {state.tasks.map((task) => (
                  <article className={`item ${task.done ? 'done' : ''}`} key={task.id}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-(--line)" checked={task.done} onChange={() => toggleTaskDone(task.id)} />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg">{task.title}</h3>
                          <span className="badge muted">{task.area}</span>
                          <span className="badge">{formatPriority(task.priority)}</span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-(--muted)">{task.note}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-(--muted)">Due {task.due}</p>
                      </div>
                    </div>
                    <button className="planner-button ghost" type="button" onClick={() => removeTask(task.id)}>
                      Delete
                    </button>
                  </article>
                ))}
              </div>

              <div className="row-actions mt-4">
                <button className="planner-button ghost" type="button" onClick={exportTasks}>
                  Export tasks
                </button>
                <button className="planner-button ghost" type="button" onClick={() => tasksImportRef.current?.click()}>
                  Import tasks
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 text-(--muted)">
                Share the tasks file with someone else. When they import it, they will see the same tasks in this app.
              </p>
              <input
                ref={tasksImportRef}
                hidden
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void importTasks(file)
                  }
                  event.currentTarget.value = ''
                }}
              />
            </div>

            <div className="planner-card" id="habits">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">Habits</p>
                  <h2 className="mt-2 text-2xl">Build momentum</h2>
                </div>
                <span className="badge muted">{state.habits.length} tracked</span>
              </div>

              <form className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={addHabit}>
                <input
                  className="planner-input"
                  placeholder="Habit name"
                  value={habitDraft.title}
                  onChange={(event) => setHabitDraft((current) => ({ ...current, title: event.target.value }))}
                />
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    className="planner-input"
                    placeholder="Cadence"
                    value={habitDraft.cadence}
                    onChange={(event) => setHabitDraft((current) => ({ ...current, cadence: event.target.value }))}
                  />
                  <button className="planner-button" type="submit">Add habit</button>
                </div>
              </form>

              <div className="item-list mt-5">
                {state.habits.map((habit) => (
                  <article className={`item ${habit.doneToday ? 'done' : ''}`} key={habit.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg">{habit.title}</h3>
                        <span className="badge muted">{habit.cadence}</span>
                      </div>
                      <p className="mt-1 text-sm text-(--muted)">{habit.streak} day streak</p>
                    </div>
                    <div className="row-actions justify-end">
                      <button className="planner-button ghost" type="button" onClick={() => toggleHabit(habit.id)}>
                        {habit.doneToday ? 'Undo' : 'Done'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="card-grid cols-2">
            <div className="planner-card" id="notes">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">Notes</p>
                  <h2 className="mt-2 text-2xl">Capture ideas</h2>
                </div>
                <span className="badge muted">{state.notes.length} notes</span>
              </div>

              <form className="mt-4 grid gap-3" onSubmit={addNote}>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="planner-input"
                    placeholder="Note title"
                    value={noteDraft.title}
                    onChange={(event) => setNoteDraft((current) => ({ ...current, title: event.target.value }))}
                  />
                  <input
                    className="planner-input"
                    placeholder="Tag"
                    value={noteDraft.tag}
                    onChange={(event) => setNoteDraft((current) => ({ ...current, tag: event.target.value }))}
                  />
                </div>
                <textarea
                  className="planner-textarea"
                  placeholder="Write a short note"
                  value={noteDraft.body}
                  onChange={(event) => setNoteDraft((current) => ({ ...current, body: event.target.value }))}
                />
                <div className="flex justify-end">
                  <button className="planner-button" type="submit">Add note</button>
                </div>
              </form>

              <div className="card-grid mt-5">
                {state.notes.map((note) => (
                  <article className="planner-card" key={note.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg">{note.title}</h3>
                          <span className="badge muted">{note.tag}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-(--muted)">{note.body}</p>
                      </div>
                      <button className="planner-button ghost" type="button" onClick={() => toggleNoteFavorite(note.id)}>
                        {note.favorite ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="planner-card" id="shopping">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">Shopping</p>
                  <h2 className="mt-2 text-2xl">Keep lists simple</h2>
                </div>
                <span className="badge muted">{state.shopping.length} items</span>
              </div>

              <form className="mt-4 grid gap-3" onSubmit={addShoppingItem}>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="planner-input"
                    placeholder="Item name"
                    value={shoppingDraft.name}
                    onChange={(event) => setShoppingDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                  <input
                    className="planner-input"
                    type="number"
                    min={1}
                    value={shoppingDraft.quantity}
                    onChange={(event) => setShoppingDraft((current) => ({ ...current, quantity: Number(event.target.value) || 1 }))}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    className="planner-input"
                    placeholder="Store"
                    value={shoppingDraft.store}
                    onChange={(event) => setShoppingDraft((current) => ({ ...current, store: event.target.value }))}
                  />
                  <button className="planner-button" type="submit">Add item</button>
                </div>
              </form>

              <div className="item-list mt-5">
                {state.shopping.map((item) => (
                  <article className={`item ${item.done ? 'done' : ''}`} key={item.id}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-(--line)" checked={item.done} onChange={() => toggleShoppingDone(item.id)} />
                      <div>
                        <h3 className="text-lg">{item.name}</h3>
                        <p className="mt-1 text-sm text-(--muted)">{item.store}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button className="planner-button ghost px-3 py-2" type="button" onClick={() => adjustShoppingQuantity(item.id, -1)}>-</button>
                          <span className="badge muted">Qty {item.quantity}</span>
                          <button className="planner-button ghost px-3 py-2" type="button" onClick={() => adjustShoppingQuantity(item.id, 1)}>+</button>
                        </div>
                      </div>
                    </div>
                    <button className="planner-button ghost" type="button" onClick={() => removeShoppingItem(item.id)}>
                      Delete
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="planner-card" id="inspiration">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Inspiration</p>
                <h2 className="mt-2 text-2xl">Local art, no hotlinks</h2>
              </div>
              <span className="badge muted">{selectedVisual.title}</span>
            </div>

            <div className="visual-grid mt-4">
              {visualLibrary.map((visual) => (
                <button
                  key={visual.id}
                  className="visual-card"
                  type="button"
                  data-active={visual.id === state.featuredVisualId}
                  onClick={() => setState((current) => ({ ...current, featuredVisualId: visual.id }))}
                >
                  <img src={visual.src} alt={visual.title} />
                  <div className="visual-copy">
                    <h3 className="text-lg">{visual.title}</h3>
                    <p className="mt-1 text-sm text-(--muted)">{visual.caption}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="card-grid cols-2">
            <div className="planner-card">
              <p className="section-kicker" id="theme">Theme</p>
              <h2 className="mt-2 text-2xl">Match the room</h2>
              <p className="mt-2 text-sm leading-6 text-(--muted)">
                Smart Planner follows your preference or the system setting, and updates the surface colors immediately.
              </p>
              <div className="row-actions mt-4">
                <button className="planner-button ghost" type="button" onClick={() => setTheme('system')}>
                  System
                </button>
                <button className="planner-button ghost" type="button" onClick={() => setTheme('light')}>
                  Light
                </button>
                <button className="planner-button ghost" type="button" onClick={() => setTheme('dark')}>
                  Dark
                </button>
              </div>
            </div>

            <div className="planner-card">
              <p className="section-kicker" id="backup">Backup</p>
              <h2 className="mt-2 text-2xl">Import or reset</h2>
              <p className="mt-2 text-sm leading-6 text-(--muted)">
                Keep your planner portable with JSON import/export. Everything stays local.
              </p>
              <div className="row-actions mt-4">
                <button className="planner-button ghost" type="button" onClick={exportState}>Export</button>
                <button className="planner-button ghost" type="button" onClick={() => importRef.current?.click()}>Import</button>
                <button className="planner-button ghost" type="button" onClick={resetPlanner}>Reset</button>
              </div>
              <input
                ref={importRef}
                hidden
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void importState(file)
                  }
                  event.currentTarget.value = ''
                }}
              />
            </div>
          </section>

          <div className="footer-note px-1 pb-2 text-center" id="bottom">
            Smart Planner stores all content locally in your browser and does not depend on external APIs, images, or analytics. Built for{' '}
            <a className="underline underline-offset-4" href="https://freeappstore.online" target="_blank" rel="noreferrer">
              freeappstore.online
            </a>
            .
          </div>

          <div className="bottom-dock surface" aria-label="Smart Planner quick navigation">
            <button className="dock-button" type="button" onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} aria-label="Scroll to top">
              ↑
            </button>
            <button className="dock-button" type="button" onClick={() => document.getElementById('bottom')?.scrollIntoView({ behavior: 'smooth', block: 'end' })} aria-label="Scroll to bottom">
              ↓
            </button>
          </div>
        </div>
      </main>
  )
}

export default function App() {
  return <AppShellContent />
}
