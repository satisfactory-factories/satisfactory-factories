import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Factory, PlannerState } from '@/interfaces/planner/FactoryInterface'
import { calculateFactory, newFactory } from '@/utils/factory-management/factory'
import * as FactoryManager from '@/utils/factory-management/factory'
import { useAppStore } from '@/stores/app-store'
import { addProductToFactory } from '@/utils/factory-management/products'
import { gameData } from '@/utils/gameData'
import { getCurrentTab } from '@/utils/plannerStateManagement'

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
})
