import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Factory, FactoryTab, PlannerState } from '@/interfaces/planner/FactoryInterface'
import { calculateFactory, newFactory } from '@/utils/factory-management/factory'
import * as FactoryManager from '@/utils/factory-management/factory'
import { useAppStore } from '@/stores/app-store'
import { addProductToFactory } from '@/utils/factory-management/products'
import { gameData } from '@/utils/gameData'
import { getCurrentTab } from '@/utils/plannerStateManagement'
import { createPinia, setActivePinia } from 'pinia'
import eventBus from '@/utils/eventBus'

describe('app-store', () => {
  let appStore: ReturnType<typeof useAppStore>

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks()

    // Initialize the auth store with the mocked fetch
    appStore = useAppStore()
  })

  // Things it does upon execution
  describe('initialization', () => {
    it('should initialize the store with the correct default values', () => {
      expect(appStore.getFactories()).toEqual([])
      const defaultTab = {
        id: expect.any(String),
        name: 'Default',
        displayOrder: 0,
        factories: [],
      }
      const currentTab = getCurrentTab(appStore.getState())
      expect(currentTab).toEqual(defaultTab)

      const defaultState: PlannerState = {
        currentTabId: currentTab.id,
        lastSaved: null,
        tabs: { [currentTab.id]: currentTab },
        user: null,
        userOptions: {
          satisfactionBreakdowns: false,
        },
      }
      expect(appStore.plannerState).toEqual(defaultState)
    })

    describe('factoryTab migration', () => {
      let mockFactory: Factory
      let mockFactoryTab: FactoryTab

      beforeEach(() => {
        mockFactory = newFactory('Foo')
        mockFactoryTab = {
          id: 'sometab',
          name: 'Factory Tab',
          displayOrder: 0,
          factories: [mockFactory],
        }
        localStorage.setItem('factoryTabs', JSON.stringify([mockFactoryTab]))
        vi.spyOn(eventBus, 'emit')

        // Nullify the previously initialized store
        setActivePinia(createPinia())
        appStore = useAppStore()
      })

      it('should properly handle a factoryTab migration', () => {
        // Ensure the factoryTab was migrated
        const plannerState = appStore.getState()

        expect(plannerState).toEqual({
          user: null,
          currentTabId: plannerState.currentTabId,
          lastSaved: null,
          userOptions: {
            satisfactionBreakdowns: false,
          },
          tabs: {
            [plannerState.currentTabId]: {
              id: plannerState.currentTabId,
              name: 'Factory Tab',
              displayOrder: 0,
              factories: [mockFactory],
            },
          },
        })

        expect(eventBus.emit).toHaveBeenCalledWith('toast', {
          message: 'Your planner data has just been migrated to the new format. You will need to re-log in if you were backing up your data with an account.\n\nPlease report any issues with missing data etc to Discord, where we can help you restore any lost data.',
          type: 'success',
        })

        // Ensure the old items were removed
        // expect(localStorage.getItem('factoryTabs')).toBe(null)
        expect(localStorage.getItem('currentFactoryTabIndex')).toBe(null)

        // Ensure the plannerSate was saved
        expect(localStorage.getItem('plannerState')).not.toBe(null) // Too hard to figure out the exact format with ref etc
      })
    })
  })

  describe('plannerState watcher', () => {
    it('should update the last edited time when it was previously unedited', () => {
      // Get the current edit time
      const editTime = appStore.getLastEdited()

      // Make a change
      const plannerState = appStore.getState()
      plannerState.user = 'foo'

      // Wait a little bit for the watcher to trigger
      setTimeout(() => {
        expect(appStore.getLastEdited()).not.toEqual(editTime)

        const plannerLastEdited = localStorage.getItem('plannerLastEdited')
        expect(plannerLastEdited).not.toEqual(editTime)
      }, 50)
    })
  })

  describe('initFactories', () => {
    let factories: Factory[]
    let factory: Factory
    beforeEach(() => {
      factory = newFactory('Foo')

      addProductToFactory(factory, {
        id: 'CopperIngot',
        amount: 1337,
        recipe: 'IngotCopper',
      })

      factories = [factory]
      calculateFactory(factory, factories, gameData)
    })
    // #317 - broken plan loading from v0.2 data
    it('should initialize factories with missing powerProducer keys', () => {
      // Malform the object to remove the powerProducers key for test
      // @ts-ignore
      delete factory.powerProducers
      expect(factory.powerProducers).not.toBeDefined()

      appStore.initFactories(factories)

      expect(factory.powerProducers).toBeDefined()
    })
    it('#222: should initialize factories with missing sync data', () => {
      // @ts-ignore
      delete factory.inSync
      // @ts-ignore
      delete factory.syncState
      expect(factory.inSync).not.toBeDefined()
      expect(factory.syncState).not.toBeDefined()

      appStore.initFactories(factories)

      expect(factory.inSync).toBe(null)
      expect(factory.syncState).toBeDefined()
    })

    it('#244: should initialize factories with missing part data, and should recalculate it', () => {
      // Malform the part data
      // @ts-ignore
      factory.parts.CopperIngot.amountRequiredExports = undefined
      // @ts-ignore
      factory.parts.CopperIngot.amountRequiredProduction = undefined

      expect(factory.parts.CopperIngot.amountRequiredExports).not.toBeDefined()
      expect(factory.parts.CopperIngot.amountRequiredProduction).not.toBeDefined()

      // Initialize the factories
      appStore.initFactories(factories)

      // Should now be there
      expect(factory.parts.CopperIngot.amountRequiredExports).toBeDefined()
      expect(factory.parts.CopperIngot.amountRequiredProduction).toBeDefined()
    })

    it('#180: should initialize factories with missing part power and exportability data', () => {
      // @ts-ignore
      factory.parts.CopperIngot.amountRequiredPower = undefined
      // @ts-ignore
      factory.parts.CopperIngot.amountSuppliedViaRaw = undefined
      // @ts-ignore
      factory.parts.CopperIngot.exportable = undefined

      expect(factory.parts.CopperIngot.amountRequiredPower).not.toBeDefined()
      expect(factory.parts.CopperIngot.amountSuppliedViaRaw).not.toBeDefined()
      expect(factory.parts.CopperIngot.exportable).not.toBeDefined()

      appStore.initFactories(factories)

      expect(factory.parts.CopperIngot.amountRequiredPower).toBe(0)
      expect(factory.parts.CopperIngot.amountSuppliedViaRaw).toBe(0)
      expect(factory.parts.CopperIngot.exportable).toBe(true)
    })

    it('#180: should initialize factories with missing power data', () => {
      // @ts-ignore
      delete factory.powerProducers
      expect(factory.powerProducers).not.toBeDefined()

      // @ts-ignore
      delete factory.power
      expect(factory.power).not.toBeDefined()

      appStore.initFactories(factories)

      expect(factory.powerProducers).toBeDefined()
      expect(factory.power).toBeDefined()
    })

    it('should initialize factories with missing previous inputs data', () => {
      // @ts-ignore
      delete factory.previousInputs
      expect(factory.previousInputs).not.toBeDefined()

      appStore.initFactories(factories)

      expect(factory.previousInputs).toBeDefined()
    })

    it('#250: should initialize factories with missing note data', () => {
      // @ts-ignore
      delete factory.notes
      expect(factory.notes).not.toBeDefined()

      appStore.initFactories(factories)

      expect(factory.notes).toBeDefined()
    })

    it('#250: should initialize factories with missing task data', () => {
      // @ts-ignore
      delete factory.tasks
      expect(factory.tasks).not.toBeDefined()

      appStore.initFactories(factories)

      expect(factory.tasks).toBeDefined()
    })

    it('should generate a data version', () => {
      appStore.initFactories(factories)
      expect(factory.dataVersion).toBeDefined()
    })

    it('should call calculateFactories when required', () => {
      // Trigger a recalculation
      // @ts-ignore
      factory.power = undefined

      // Spy on the calculateFactories function
      const spy = vi.spyOn(FactoryManager, 'calculateFactories')

      appStore.initFactories(factories)

      expect(spy).toHaveBeenCalled()
    })
    it('should NOT call calculateFactories when not required', () => {
      // @ts-ignore
      factory.tasks = undefined

      // Spy on the calculateFactories function
      const spy = vi.spyOn(FactoryManager, 'calculateFactories')

      appStore.initFactories(factories)

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('lastEdited', () => {
    describe('initial state', () => {
      beforeEach(() => {
        // Wipe the localStorage as other tests may have written to it
        localStorage.removeItem('plannerLastEdited')
      })
      it('should return current date if no edits were made', () => {
        // Initially expect it to be un-set
        expect(localStorage.getItem('plannerLastEdited')).toBe(null)

        // Calling the function makes it set it, so it should return set whenever it's called
        expect(appStore.getLastEdited()).toBeInstanceOf(Date)
      })
    })

    describe('post initialization', () => {
      beforeEach(async () => {
        // Make an edit
        const plannerState = appStore.getState()
        plannerState.user = 'foo'
        await new Promise(resolve => setTimeout(resolve, 50)) // Wait for the watcher to trigger
      })
      it('should return the last edited time', () => {
        expect(appStore.getLastEdited()).not.toBe(null)
      })

      it('should return the expected value when called to set a new edit time', () => {
        const editDate = new Date()
        appStore.setLastEdited(editDate)

        expect(appStore.getLastEdited()).toEqual(editDate)
      })

      it('should update the last edited time when a previous edit was made', async () => {
        // Wait a little bit for the watcher to trigger
        await new Promise(resolve => setTimeout(resolve, 50))

        // Get the current edit time
        const previouslyEdited = appStore.getLastEdited()

        // Simulate the user making a change after some time
        await new Promise(resolve => setTimeout(resolve, 1234))

        // Make another change
        appStore.getState().user = 'foobar'

        // Wait a little bit for the watcher to trigger
        await new Promise(resolve => setTimeout(resolve, 50))

        const lastEdited = appStore.getLastEdited()
        expect(lastEdited).not.toEqual(previouslyEdited)
      })
    })
  })
  describe('lastSaved', () => {
    describe('initial state', () => {
      beforeEach(() => {
        // Wipe the localStorage as other tests may have written to it
        localStorage.removeItem('plannerLastSaved')
      })
      it('should return current date if no saves were made', () => {
        // Initially expect it to be un-set
        expect(localStorage.getItem('plannerLastSaved')).toBe(null)

        // Calling the function should NOT set it unlike edit.
        expect(appStore.getLastSaved()).toBe(null)
      })
    })

    describe('post initialization', () => {
      it('should return null as save has not yet been invoked', () => {
        expect(appStore.getLastSaved()).toBe(null)
      })

      it('should return the last saved time when a save was made', async () => {
        const saveDate = new Date()
        // Simulate a save
        localStorage.setItem('plannerLastSaved', saveDate.toISOString())

        expect(appStore.getLastSaved()).toEqual(saveDate)
      })

      it('should return the expected value when called to set a new save time', () => {
        const saveDate = new Date()
        appStore.setLastSaved(saveDate)

        expect(appStore.getLastSaved()).toEqual(saveDate)
      })
    })
  })

  describe('userOptions', () => {
    it('should return the user options', () => {
      expect(appStore.getUserOptions()).toEqual({
        satisfactionBreakdowns: false,
      })
    })

    it('should return user options when changed', () => {
      appStore.setUserOptions({
        satisfactionBreakdowns: true,
      })
      expect(appStore.getUserOptions()).toEqual({
        satisfactionBreakdowns: true,
      })
    })
  })

  describe('loading process', () => {
    beforeEach(() => {
      vi.spyOn(eventBus, 'emit')
      appStore.getFactories() // Init the state
    })
    describe('prepareLoader', () => {
      it('set the isLoaded value to false', async () => {
        await appStore.prepareLoader()
        expect(appStore.isLoaded).toBe(false)
      })

      it('should emit the plannerHideContent event', async () => {
        await appStore.prepareLoader()
        expect(eventBus.emit).toHaveBeenCalledWith('plannerHideContent')
      })

      it('should set the factories as expected if supplied', async () => {
        const factory = newFactory('Foo')
        const factory2 = newFactory('Foo2')

        await appStore.prepareLoader([factory, factory2])

        expect(appStore.getFactories()).toEqual([factory, factory2])
      })

      it('should emit the prepareForLoad event with the correct info', async () => {
        const factory = newFactory('Foo')
        const factory2 = newFactory('Foo2')
        factory2.hidden = true

        await appStore.prepareLoader([factory, factory2])

        expect(eventBus.emit).toHaveBeenCalledWith('prepareForLoad', {
          count: 2,
          shown: 1,
        })
      })

      describe('beginLoading', () => {
        let factories: Factory[]

        beforeEach(async () => {
          vi.spyOn(eventBus, 'emit')
          const factory = newFactory('Foo')
          const factory2 = newFactory('Foo2')
          factories = [factory, factory2]
          await appStore.prepareLoader(factories)
        })
        afterEach(() => {
          localStorage.removeItem('preLoadFactories')
        })

        it('should load another list of factories if preLoadFactories contains them', async () => {
          // Set up prepareForLoad event spy
          const mockFailedFactories = [
            newFactory('Bar'),
          ]
          localStorage.setItem('preLoadFactories', JSON.stringify(mockFailedFactories))

          // Re-call the loading process as we've set the localStorage above.
          await appStore.beginLoading(factories)

          expect(eventBus.emit).toHaveBeenCalledWith('toast', {
            message: 'Unsuccessful load detected, loading previous factory data.',
            type: 'warning',
          })
          expect(eventBus.emit).toHaveBeenCalledWith('prepareForLoad', {
            count: 1, // Not 2 as per the beforeEach
            shown: 1,
          })
        })

        it('should emit the prepareForLoad event with the correct info', async () => {
          eventBus.emit('readyForData') // Which calls beginLoading

          expect(eventBus.emit).toHaveBeenCalledWith('prepareForLoad', {
            count: 2,
            shown: 2,
          })
        })

        // Tried doing this but the spy won't work.
        // it('should call loadNextFactory', async () => {
        //   const spy = vi.spyOn(appStore, 'loadNextFactory')
        //
        //   await appStore.beginLoading(factories)
        //
        //   expect(spy).toHaveBeenCalled()
        // })
      })

      describe('loadNextFactory', () => {
        let factories: Factory[]
        const mockFailedFactories = [
          newFactory('Bar'),
        ]
        beforeEach(async () => {
          // Set up incrementLoad event spy
          vi.spyOn(eventBus, 'emit')

          const factory = newFactory('Foo')
          const factory2 = newFactory('Foo2')
          factories = [factory, factory2]
        })
        afterEach(() => {
          // Reset the spy
          vi.resetAllMocks()
          localStorage.removeItem('preLoadFactories')
        })

        it('should have loaded the correct number of factories', async () => {
          await appStore.prepareLoader(factories)

          await appStore.beginLoading(factories)

          expect(appStore.getFactories()).toEqual(factories)
        })

        it('should have loaded the correct number of factories given preLoadFactories', async () => {
          localStorage.setItem('preLoadFactories', JSON.stringify(mockFailedFactories))
          await appStore.prepareLoader(factories)

          await appStore.beginLoading(factories)

          // Check the resulting data
          expect(appStore.getFactories()).toEqual(mockFailedFactories)

          // Check if the local storage item was removed
          expect(localStorage.getItem('preLoadFactories')).toBe(null)
        })

        it('should have emitted the incrementLoad,increment event the correct number of times', async () => {
          await appStore.prepareLoader(factories)

          await appStore.beginLoading(factories)

          expect(eventBus.emit).toHaveBeenCalledTimes(7) // 5 other times, annoyingly we can't check the payload
          expect(eventBus.emit).toHaveBeenCalledWith('incrementLoad', {
            step: 'increment',
          })
        })

        it('should have emitted the loadingCompleted event', async () => {
          await appStore.prepareLoader(factories)

          await appStore.beginLoading(factories)

          expect(eventBus.emit).toHaveBeenCalledWith('loadingCompleted')
        })
      })
    })
  })
})
