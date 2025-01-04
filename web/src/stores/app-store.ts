// Utilities
import { defineStore } from 'pinia'
import { Factory, FactoryPower, FactoryTab } from '@/interfaces/planner/FactoryInterface'
import { ref, watch } from 'vue'
import { calculateFactories } from '@/utils/factory-management/factory'
import { useGameDataStore } from '@/stores/game-data-store'
import { validateFactories } from '@/utils/factory-management/validation'
import eventBus from '@/utils/eventBus'

export const useAppStore = defineStore('app', () => {
  const inited = ref(false)
  let loadedCount = 0
  const factoryTabs = ref<FactoryTab[]>(JSON.parse(localStorage.getItem('factoryTabs') ?? '[]') as FactoryTab[])

  if (factoryTabs.value.length === 0) {
    factoryTabs.value = [
      {
        id: crypto.randomUUID(),
        name: 'Default',
        // Fill the tabs from the legacy factories array if present so no data gets lost
        factories: JSON.parse(localStorage.getItem('factories') ?? '[]'),
      },
    ]
  }

  const currentFactoryTabIndex = ref(0)
  const currentFactoryTab = ref(factoryTabs.value[currentFactoryTabIndex.value])

  const factories = computed({
    get () {
      // Ensure that the factories are initialized before returning them on the first request
      if (!inited.value) {
        console.log('appStore: factories.get: Factories not inited, initializing')
        initFactories(currentFactoryTab.value.factories, true)
      }
      return currentFactoryTab.value.factories
    },
    set (value) {
      currentFactoryTab.value.factories = value
    },
  })

  const lastSave = ref<Date>(new Date(localStorage.getItem('lastSave') ?? ''))
  const lastEdit = ref<Date>(new Date(localStorage.getItem('lastEdit') ?? ''))
  const isDebugMode = ref<boolean>(false)
  const isLoaded = ref<boolean>(false)
  const showSatisfactionBreakdowns = ref<boolean>(
    (localStorage.getItem('showSatisfactionBreakdowns') ?? 'false') === 'true'
  )
  const gameDataStore = useGameDataStore()

  // Watch the tab index, if it changes we need to throw up a loading
  watch(currentFactoryTabIndex, () => {
    requestAnimationFrame(() => {
      console.log('appStore: currentFactoryTabIndex watcher: Tab index changed, starting load.')
      currentFactoryTab.value = factoryTabs.value[currentFactoryTabIndex.value]
      inited.value = false
      eventBus.emit('prepareForLoad', currentFactoryTab.value.factories.length)
      startLoad(currentFactoryTab.value.factories, true)
    })
  })

  // Watch the factories array for changes
  watch(factoryTabs.value, () => {
    localStorage.setItem('factoryTabs', JSON.stringify(factoryTabs.value))
    setLastEdit() // Update last edit time whenever the data changes, from any source.
  }, { deep: true })

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

  const startLoad = async (newFactories?: Factory[], loadMode = false) => {
    isLoaded.value = false
    const factoriesToLoad = newFactories ?? currentFactoryTab.value.factories
    console.log('appStore: startLoad', factoriesToLoad, 'loadMode:', loadMode)

    // Set and initialize factories
    setFactories(factoriesToLoad, loadMode)

    // console.log('appStore: startLoad: Cleared current factories, awaiting Vue tick')
    // await nextTick() // Wait for Vue's reactivity system to complete updating the loader

    // Tell loader to prepare for load
    eventBus.emit('prepareForLoad', factories.value.length)
  }

  const incrementalLoad = async (newFactories: Factory[], loadMode = false) => {
    console.log('appStore: loadFactoriesIncrementally: start', newFactories, 'loadMode', loadMode)
    loadedCount = 0

    // Reset the factories currently loaded
    currentFactoryTab.value.factories = []

    if (newFactories.length === 0) {
      return
    }

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
      currentFactoryTab.value.factories.push(newFactories[loadedCount])
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

    // Ensure that the data written to local storage is up to date
    localStorage.setItem('factoryTabs', JSON.stringify(factoryTabs.value))

    isLoaded.value = true
  }

  // ==== FACTORY MANAGEMENT
  // This function is needed to ensure that data fixes are applied as we migrate things and change things around.
  const initFactories = (newFactories: Factory[], loadMode = false): Factory[] => {
    console.log('appStore: initFactories', newFactories, 'load mode:', loadMode)
    let needsCalculation = false

    try {
      validateFactories(newFactories) // Ensure the data is clean
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
      eventBus.emit('hideLoading')
    }

    console.log('appStore: initFactories - completed')

    inited.value = true
    factories.value = newFactories // Also calls the watcher, which sets the current tab data.
    return factories.value
  }

  const setFactories = (newFactories: Factory[], loadMode = false) => {
    console.log('Setting factories', newFactories, 'loadMode:', loadMode)

    const gameData = gameDataStore.getGameData()
    if (!gameData) {
      console.error('Unable to load game data!')
      return
    }

    // Set inited to false as the new data may be invalid.
    inited.value = false

    // Init factories ensuring the data is valid
    initFactories(newFactories, loadMode)

    // Trigger calculations
    calculateFactories(newFactories, gameData, loadMode)

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
  const addTab = ({
    id = crypto.randomUUID(),
    name = 'New Tab',
    factories = [],
  } = {} as Partial<FactoryTab>) => {
    factoryTabs.value.push({
      id,
      name,
      factories,
    })

    currentFactoryTabIndex.value = factoryTabs.value.length - 1
  }

  const removeCurrentTab = async () => {
    if (factoryTabs.value.length === 1) return

    if (factories.value.length && !window.confirm('Are you sure you want to delete this tab? This will delete all factories in it.')) {
      return
    }

    factoryTabs.value.splice(currentFactoryTabIndex.value, 1)
    currentFactoryTabIndex.value = Math.min(currentFactoryTabIndex.value, factoryTabs.value.length - 1)
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
    // If the factories are not initialized, wait for a duration for the app to load then return them.
    if (!inited.value) {
      // Something wants to load these values so prepare the loader
      eventBus.emit('prepareForLoad', currentFactoryTab.value.factories.length)
      setTimeout(() => {

      })
    }
    return inited.value ? factories.value : initFactories(currentFactoryTab.value.factories)
  }

  // When the loader is ready, we will receive an event saying to initiate the load.
  eventBus.on('readyForData', () => {
    console.log('appStore: Received readyForData event, triggering load.')

    console.log('appStore: Informing loader of factory count')
    eventBus.emit('prepareForLoad', factories.value.length)

    incrementalLoad(factories.value, true)
  })

  return {
    currentFactoryTab,
    currentFactoryTabIndex,
    factoryTabs,
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
    addTab,
    removeCurrentTab,
    getSatisfactionBreakdowns,
    changeSatisfactoryBreakdowns,
    startLoad,
  }
})
