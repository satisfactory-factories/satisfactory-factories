// Utilities
import { defineStore } from 'pinia'
import { Factory, FactoryPower, FactoryTab, PlannerState } from '@/interfaces/planner/FactoryInterface'
import { ref, watch } from 'vue'
import { calculateFactories } from '@/utils/factory-management/factory'
import { useGameDataStore } from '@/stores/game-data-store'
import { validateFactories } from '@/utils/factory-management/validation'
import eventBus from '@/utils/eventBus'
import { addTab, deleteTab, getCurrentTab, getTab, newState, newTab } from '@/utils/plannerStateManagement'

export const useAppStore = defineStore('app', () => {
  const gameDataStore = useGameDataStore()
  const gameData = gameDataStore.getGameData()

  const inited = ref(false)
  let loadedCount = 0
  const plannerState = ref<PlannerState>(JSON.parse(<string>localStorage.getItem('plannerState')) as PlannerState)
  const oldState = JSON.parse(localStorage.getItem('factoryTabs') ?? '[]') as FactoryTab[] | null

  // If the new state doesn't exist and the old one does, migrate it.
  if (!plannerState.value && oldState) {
    console.log('appStore: Found old factory state, migrating.')
    const oldActiveTab = oldState[0] // We're going to assume it's the first one.
    plannerState.value = newState({
      currentTabId: oldActiveTab.id,
      tabs: oldState,
    })

    // Generate the tab display order
    plannerState.value.tabs.forEach((tab, index) => {
      tab.displayOrder = index
    })

    // Don't delete the factoryTab data just yet to ensure people have a revert option.
    // localStorage.removeItem('factoryTabs')
    localStorage.removeItem('currentFactoryTabIndex')
    localStorage.setItem('plannerState', JSON.stringify(plannerState.value))
    alert('Your planner data has just been migrated to a new format. Please report any issues to Discord.')
  }

  // If the state is not set, create a new one now
  if (!plannerState.value) {
    console.log('appStore: plannerState not found, creating new state.')
    plannerState.value = newState({})
  }

  console.log('appStore: plannerState', plannerState.value)

  const currentTab = ref(getCurrentTab(plannerState.value))
  const currentTabId = ref(currentTab.value.id)

  const factories = computed({
    get () {
      if (!currentTab.value) {
        console.error('appStore: factories.get: No current factory tab set!')
        return []
      }
      // Ensure that the factories are initialized before returning them on the first request
      if (!inited.value) {
        console.log('appStore: factories.get: Factories not inited, initializing')
        initFactories(currentTab.value.factories)
      }
      return currentTab.value.factories
    },
    set (value) {
      currentTab.value.factories = value
    },
  })

  const lastSave = ref<Date>(new Date(localStorage.getItem('lastSave') ?? ''))
  const lastEdit = ref<Date>(new Date(localStorage.getItem('lastEdit') ?? ''))
  const isDebugMode = ref<boolean>(false)
  const isLoaded = ref<boolean>(false)
  const showSatisfactionBreakdowns = ref<boolean>(
    (localStorage.getItem('showSatisfactionBreakdowns') ?? 'false') === 'true'
  )

  const shownFactories = (factories: Factory[]) => {
    return factories.filter(factory => !factory.hidden).length
  }

  // Watch the state and save changes to local storage
  watch(plannerState.value, () => {
    localStorage.setItem('plannerState', JSON.stringify(plannerState.value))
    setLastEdit() // Update last edit time whenever the data changes, from any source.
  }, { deep: true })

  // Watch the tab index, if it changes we need to throw up a loading
  watch(currentTabId, () => {
    requestAnimationFrame(() => {
      console.log('appStore: currentFactoryTabIndex watcher: Tab index changed, starting load.')
      currentTab.value = getTab(plannerState.value, currentTabId.value)
      plannerState.value.currentTabId = currentTabId.value

      prepareLoader(currentTab.value.factories)
    })
  })

  const getLastEdit = (): Date => {
    return lastEdit.value
  }

  const setLastEdit = () => {
    lastEdit.value = new Date()
    localStorage.setItem('lastEdit', lastEdit.value.toISOString())
  }
  const setLastSave = () => {
    lastSave.value = new Date()
    localStorage.setItem('lastSave', lastSave.value.toISOString())
  }

  const prepareLoader = async (newFactories?: Factory[]) => {
    isLoaded.value = false
    const factoriesToLoad = newFactories ?? factories.value
    console.log('appStore: prepareLoader', factoriesToLoad)

    // Set and initialize factories
    setFactories(factoriesToLoad)

    // Tell loader to prepare for load
    console.log('appStore: prepareLoader: Factories set, starting load process.')
    eventBus.emit('prepareForLoad', { count: factories.value.length, shown: shownFactories(factories.value) })
  }

  // When the loader is ready, we will receive an event saying to initiate the load.
  eventBus.on('readyForData', () => {
    console.log('appStore: Received readyForData event, triggering load.')

    beginLoading(factories.value, true)
  })

  const beginLoading = async (newFactories: Factory[], loadMode = false) => {
    console.log('appStore: loadFactoriesIncrementally: start', newFactories, 'loadMode', loadMode)
    loadedCount = 0

    // Reset the factories currently loaded
    currentTab.value.factories = []

    const attemptedFactories = JSON.parse(localStorage.getItem('preLoadFactories') ?? '[]') as Factory[]

    // If there are factories saved from a previous load attempt, replace them now
    if (attemptedFactories.length > 0) {
      console.log('appStore: beginLoading: Found previous factories, loading them instead.')
      newFactories = attemptedFactories
      eventBus.emit('toast', { message: 'Unsuccessful load detected, loading previous factory data.', type: 'warning' })
    } else {
      // Save the user's factories to ensure there is no data loss
      localStorage.setItem('preLoadFactories', JSON.stringify(newFactories))
    }

    // If there's nothing to load, just finish
    if (newFactories.length === 0) {
      loadingCompleted()
      return
    }

    // Inform loader of the counts. Note this will not trigger readyForData again as the v-dialog is already open at this point
    // So the loader's value are just simply updated.
    eventBus.emit('prepareForLoad', { count: newFactories.length, shown: shownFactories(newFactories) })

    const loadNextFactory = async () => {
      // console.log('loadFactoriesIncrementally: Loading factory', loadedCount + 1, '/', newFactories.length)
      if (loadedCount >= newFactories.length) {
        console.log('appStore: loadNextFactory: Finished loading factories. Requesting render.')
        eventBus.emit('incrementLoad', { step: 'render' })

        requestAnimationFrame(() => {
          // Add a small delay to allow the DOM to catch up fully before initiating the big render
          setTimeout(() => {
            loadingCompleted()
          }, 100)
        })

        return // Stop here otherwise it'll recurse infinitely
      }

      // Add the factory to the current tab's factories
      console.log('appStore: loadNextFactory: Adding factory to tab', newFactories[loadedCount])
      currentTab.value.factories.push(newFactories[loadedCount])
      eventBus.emit('incrementLoad', { step: 'increment' })
      loadedCount++

      // This enables the bar to actually grow properly
      requestAnimationFrame(async () => {
        await nextTick() // Wait for Vue's reactivity system to complete updating the loader
        // Add a small delay to allow the DOM to catch up fully before initiating the next load
        setTimeout(() => {
          loadNextFactory() // Recursively load the next factory
        }, 50)
      })
    }

    // Register the event that's emitted when the next factory should be loaded
    loadNextFactory() // Purposefully not async
  }

  const loadingCompleted = () => {
    eventBus.emit('loadingCompleted')
    isLoaded.value = true

    // Reset the saved factories
    localStorage.removeItem('preLoadFactories')
  }

  // ==== FACTORY MANAGEMENT
  // This function is needed to ensure that data fixes are applied as we migrate things and change things around.
  const initFactories = (newFactories: Factory[]): Factory[] => {
    console.log('appStore: initFactories', newFactories)
    let needsCalculation = false

    try {
      validateFactories(newFactories, gameData) // Ensure the data is clean
    } catch (err) {
      alert('Error validating factories: ' + err)
    }

    newFactories.forEach(factory => {
      // Patch for #222
      if (factory.inSync === undefined) {
        factory.inSync = null
      }
      if (factory.syncState === undefined) {
        factory.syncState = {}
      }

      // Patch for #244 and #180
      // Detect if the factory.parts[part].amountRequiredExports is missing and calculate it.
      Object.keys(factory.parts).forEach(part => {
        // For #244
        if (factory.parts[part].amountRequiredExports === undefined) {
          factory.parts[part].amountRequiredExports = 0
          needsCalculation = true
        }
        if (factory.parts[part].amountRequiredProduction === undefined) {
          factory.parts[part].amountRequiredProduction = 0
          needsCalculation = true
        }

        // For #180
        if (factory.parts[part].amountRequiredPower === undefined) {
          factory.parts[part].amountRequiredPower = 0
          needsCalculation = true
        }
        if (factory.parts[part].amountSuppliedViaRaw === undefined) {
          factory.parts[part].amountSuppliedViaRaw = 0
          needsCalculation = true
        }
        if (factory.parts[part].exportable === undefined) {
          factory.parts[part].exportable = true
          needsCalculation = true
        }
      })

      // Patch for #250
      if (factory.tasks === undefined) {
        factory.tasks = []
      }
      if (factory.notes === undefined) {
        factory.notes = ''
      }

      // Patch for #180
      if (factory.powerProducers === undefined) {
        factory.powerProducers = []
        needsCalculation = true
      }
      if (factory.power === undefined) {
        factory.power = {} as FactoryPower
        needsCalculation = true
      }
      if (factory.previousInputs === undefined) {
        factory.previousInputs = []
      }

      // Delete keys that no longer exist
      // @ts-ignore
      if (factory.internalProducts) delete factory.internalProducts
      // @ts-ignore
      if (factory.totalPower) delete factory.totalPower
      // @ts-ignore
      if (factory.surplus) delete factory.surplus
      // @ts-ignore
      if (factory.exports) delete factory.exports

      // Update data version
      factory.dataVersion = '2025-01-03.2'
    })

    if (needsCalculation) {
      console.log('appStore: Forcing calculation of factories due to data migration')
      calculateFactories(newFactories, gameDataStore.getGameData())
    }

    console.log('appStore: initFactories - completed')

    inited.value = true
    factories.value = newFactories // Also calls the watcher, which sets the current tab data.
    return factories.value
  }

  const setFactories = (newFactories: Factory[]) => {
    console.log('Setting factories', newFactories)

    const gameData = gameDataStore.getGameData()
    if (!gameData) {
      console.error('Unable to load game data!')
      return
    }

    // Set inited to false as the new data may be invalid.
    inited.value = false

    // Init factories ensuring the data is valid
    initFactories(newFactories)

    // Trigger calculations
    calculateFactories(newFactories, gameData)

    // For each factory, set the previous inputs to the current inputs.
    newFactories.forEach(factory => {
      factory.previousInputs = factory.inputs
    })

    factories.value = newFactories
    // Will also call the watcher, which sets the current tab data.

    console.log('appStore: setFactories: Factories set.', factories.value)
  }

  const addFactory = (factory: Factory) => {
    factories.value.push(factory)
  }

  const removeFactory = (id: number) => {
    const index = factories.value.findIndex(factory => factory.id === id)
    if (index !== -1) {
      factories.value.splice(index, 1)
    }
  }

  const clearFactories = () => {
    factories.value.length = 0
    factories.value = []
  }
  // ==== END FACTORY MANAGEMENT

  // ==== TAB MANAGEMENT
  const createNewTab = ({
    name = 'New Tab',
    factories = [],
  } = {} as Partial<FactoryTab>) => {
    const newTabData = newTab({ name, factories })
    addTab(plannerState.value, newTabData)
    currentTabId.value = newTabData.id
  }

  const removeCurrentTab = async () => {
    if (plannerState.value.tabs.length === 1) return

    deleteTab(plannerState.value, currentTab.value)
    // Get the new tab index by looking at the last tab in the list
    currentTabId.value = plannerState.value.currentTabId

    // We now need to force a load of the factories
    console.log('appStore: removeCurrentTab: Tab removed, preparing loader.')
    prepareLoader(getCurrentTab(plannerState.value).factories)
  }
  // ==== END TAB MANAGEMENT

  const getSatisfactionBreakdowns = () => {
    return showSatisfactionBreakdowns
  }
  const changeSatisfactoryBreakdowns = () => {
    showSatisfactionBreakdowns.value = !showSatisfactionBreakdowns.value
    localStorage.setItem('showSatisfactionBreakdowns', showSatisfactionBreakdowns.value ? 'true' : 'false')
  }

  // ==== MISC
  const debugMode = () => {
    if (window.location.hostname !== 'satisfactory-factories.app') {
      return true
    }

    return window.location.search.includes('debug')
  }

  isDebugMode.value = debugMode()
  // ==== END MISC

  const getFactories = () => {
    if (!currentTab.value) {
      console.error('appStore: getFactories: No current factory tab set!')
      return []
    }
    // If the factories are not initialized, wait for a duration for the app to load then return them.
    if (!inited.value) {
      // Something wants to load these values so prepare the loader
      eventBus.emit('prepareForLoad', {
        count: currentTab.value.factories.length,
        shown: shownFactories(currentTab.value.factories),
      })
    }
    return inited.value ? factories.value : initFactories(currentTab.value.factories)
  }

  const getTabs = () => {
    return plannerState.value.tabs
  }

  const setTabs = (tabs: FactoryTab[]) => {
    plannerState.value.tabs = tabs
    // Get the first tab in the list
    currentTabId.value = plannerState.value.tabs[0].id
  }

  return {
    currentTab,
    currentTabId,
    plannerState,
    factories,
    lastSave,
    lastEdit,
    isDebugMode,
    isLoaded,
    getLastEdit,
    setLastSave,
    setLastEdit,
    getFactories,
    setFactories,
    initFactories,
    addFactory,
    removeFactory,
    clearFactories,
    createNewTab,
    removeCurrentTab,
    getTabs,
    setTabs,
    getSatisfactionBreakdowns,
    changeSatisfactoryBreakdowns,
    prepareLoader,
  }
})
