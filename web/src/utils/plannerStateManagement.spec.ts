import { beforeEach, describe, expect, it } from 'vitest'
import { FactoryTab, PlannerState } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import {
  addTab, deleteTab,
  getCurrentTab,
  getTab,
  migrateFactoryTabsToState,
  newState,
  newTab,
} from '@/utils/plannerStateManagement'

describe('plannerStateManagement', () => {
  describe('newState', () => {
    it('should create a new state with default values', () => {
      const result = newState({})

      expect(result).toEqual({
        user: null,
        currentTabId: expect.any(String),
        lastSaved: null,
        lastEdited: expect.any(Date),
        userOptions: [],
        tabs: [
          {
            id: expect.any(String),
            name: 'Default',
            displayOrder: 0,
            factories: [],
          },
        ],
      })
    })

    it('should create a new state with custom values', () => {
      const result = newState({
        user: 'test',
        currentTabId: '255',
        userOptions: {
          satisfactionBreakdowns: false,
        },
        tabs: {
          255: {
            id: '255',
            name: 'Test Tab',
            displayOrder: 0,
            factories: [],
          },
        },
      })

      expect(result).toEqual({
        user: 'test',
        currentTabId: '255',
        lastSaved: null,
        lastEdited: expect.any(Date),
        userOptions: {
          satisfactionBreakdowns: false,
        },
        tabs: [
          {
            id: '255',
            name: 'Test Tab',
            displayOrder: 0,
            factories: [],
          },
        ],
      })
    })
  })

  describe('newTab', () => {
    it('should create a new tab using default values', () => {
      const result = newTab()

      expect(result).toEqual({
        id: expect.any(String),
        name: 'Default',
        displayOrder: 0,
        factories: [],
      })
    })

    it('should create a new tab using custom values', () => {
      const result = newTab({
        tabId: '255',
        name: 'Test Tab',
        displayOrder: 0,
        factories: [],
      })

      expect(result).toEqual({
        id: '255',
        name: 'Test Tab',
        displayOrder: 0,
        factories: [],
      })
    })
  })

  describe('addTab', () => {
    it('should add a tab to the state', () => {
      const state = newState({})
      const existingTab = state.tabs[0]
      const tab = newTab()

      addTab(state, tab)

      expect(state.tabs).toEqual([existingTab, tab])
      expect(tab.displayOrder).toBe(1)
    })
  })

  describe('getCurrentTab', () => {
    const state = newState({})
    const tab1 = state.tabs[0]
    addTab(state, newTab({ tabId: '1' }))

    it('should select the original tab', () => {
      const selectedTab = getCurrentTab(state)
      expect(selectedTab).toEqual(tab1)
    })
  })

  describe('getTab', () => {
    const state = newState({})
    const tab1 = state.tabs[0]
    addTab(state, newTab({ tabId: '1' }))

    it('should return the expected tab', () => {
      const result = getTab(state, tab1.id)
      expect(result).toEqual(tab1)
    })

    it('should throw an error if the tab does not exist', () => {
      expect(() => getTab(state, '2')).toThrowError('Tab with id 2 not found')
    })
  })

  describe('deleteTab', () => {
    let state: PlannerState
    let tab1: FactoryTab
    let tab2: FactoryTab

    beforeEach(() => {
      state = newState({})
      tab1 = state.tabs[0]
      tab2 = newTab({ tabId: '1' })
      addTab(state, tab2)
    })

    it('should delete the correct tab from the state', () => {
      deleteTab(state, tab1)
      expect(state.tabs).toEqual([tab2])
    })

    it('should re-order the display order of the tabs correctly', () => {
      // Add another tab for good measure
      addTab(state, newTab({ tabId: 'foo' }))
      const tab3 = getTab(state, 'foo')
      deleteTab(state, tab2)

      expect(state.tabs).toEqual([tab1, tab3])
      expect(tab1.displayOrder).toBe(0)
      expect(tab3.displayOrder).toBe(1)
    })

    it('should throw an error if the tab does not exist', () => {
      const tabNotInState = newTab({ tabId: '2' })
      expect(() => deleteTab(state, tabNotInState)).toThrowError('Tab with id 2 not found')
    })
  })

  describe('migrateFactoryTabsToState', () => {
    let oldState: FactoryTab[]
    const mockFactory = newFactory('Iron Ingots', 0, 1)

    beforeEach(() => {
      oldState = [
        {
          id: '1',
          name: 'Tab 1',
          displayOrder: 0,
          factories: [mockFactory],
        },
        {
          id: '2',
          name: 'Tab 2',
          displayOrder: 1,
          factories: [],
        },
      ]
    })
    it('should perform the state migration successfully', () => {
      const newState = migrateFactoryTabsToState(oldState)

      expect(newState).toEqual({
        user: null,
        currentTabId: '1',
        lastSaved: null,
        lastEdited: expect.any(Date),
        userOptions: [],
        tabs: [
          {
            id: '1',
            name: 'Tab 1',
            displayOrder: 0,
            factories: [mockFactory],
          },
          {
            id: '2',
            name: 'Tab 2',
            displayOrder: 1,
            factories: [],
          },
        ],
      })
    })
  })
})
