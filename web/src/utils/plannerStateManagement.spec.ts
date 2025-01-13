import { beforeEach, describe, expect, it } from 'vitest'
import { FactoryTab } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { migrateFactoryTabsToState } from '@/utils/plannerStateManagement'

describe('plannerStateManagement', () => {
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
