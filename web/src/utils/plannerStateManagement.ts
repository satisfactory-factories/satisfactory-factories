import { Factory, FactoryTab, PlannerState } from '@/interfaces/planner/FactoryInterface'

interface PlannerStateOptions {
  user?: string,
  currentTabId?: string;
  userOptions?: string[]
  tabs?: FactoryTab[],
}

interface FactoryTabOptions {
  tabId?: string
  name?: string
  factories?: Factory[]
  displayOrder?: number
}

export const newState = (options: PlannerStateOptions): PlannerState => {
  const newTabData = newTab({
    displayOrder: 0,
  })
  return {
    user: options.user ?? null,
    currentTabId: options.currentTabId ?? newTabData.id,
    lastSaved: null,
    userOptions: options.userOptions ?? [],
    tabs: options.tabs ?? [newTabData],
  }
}

export const newTab = (options?: FactoryTabOptions): FactoryTab => {
  return {
    id: options?.tabId ?? crypto.randomUUID(),
    name: options?.name ?? 'Default',
    // Fill the tabs from the legacy factories array if present so no data gets lost
    factories: options?.factories ?? [],
    displayOrder: options?.displayOrder ?? 0,
  }
}

export const addTab = (state: PlannerState, tab: FactoryTab): void => {
  tab.displayOrder = state.tabs.length
  state.tabs.push(tab)
}

export const getCurrentTab = (state: PlannerState): FactoryTab => {
  return getTab(state, state.currentTabId)
}

export const getTab = (state: PlannerState, tabId: string): FactoryTab => {
  const tab = state.tabs.find(tab => tab.id === tabId)
  if (!tab) {
    throw new Error(`Tab with id ${tabId} not found`)
  }
  return tab
}

export const deleteTab = (state: PlannerState, tab: FactoryTab): void => {
  const index = state.tabs.findIndex(t => t.id === tab.id)
  if (index === -1) {
    throw new Error(`Tab with id ${tab.id} not found`)
  }
  state.tabs.splice(index, 1)

  // Regenerate display orders
  state.tabs.forEach((tab, index) => {
    tab.displayOrder = index
  })

  // Reset the current tab ID to be the last tab ID
  state.currentTabId = state.tabs[state.tabs.length - 1].id
}
