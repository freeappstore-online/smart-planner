export type ThemeMode = 'system' | 'light' | 'dark'

export type TaskArea = 'Work' | 'Home' | 'Personal' | 'Wellness'

export type Priority = 'Low' | 'Medium' | 'High'

export interface PlannerTask {
	id: string
	title: string
	note: string
	due: string
	area: TaskArea
	priority: Priority
	done: boolean
}

export interface PlannerHabit {
	id: string
	title: string
	cadence: string
	streak: number
	doneToday: boolean
}

export interface PlannerNote {
	id: string
	title: string
	body: string
	tag: string
	favorite: boolean
}

export interface ShoppingItem {
	id: string
	name: string
	quantity: number
	store: string
	done: boolean
}

export interface PlannerState {
	theme: ThemeMode
	featuredVisualId: string
	tasks: PlannerTask[]
	habits: PlannerHabit[]
	notes: PlannerNote[]
	shopping: ShoppingItem[]
}
