// Utilities
import { defineStore } from 'pinia'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { ref, watch } from 'vue'
import { calculateFactories } from '@/utils/factory-management/factory'
import { useGameDataStore } from '@/stores/game-data-store'

export const useAppStore = defineStore('app', () => {
  // Define state using Composition API
  const factories = ref<Factory[]>(JSON.parse(localStorage.getItem('factories') ?? '[]') as Factory[])
  const loggedInUser = ref<string>(localStorage.getItem('loggedInUser') ?? '')
  const token = ref<string>(localStorage.getItem('token') ?? '')
  const lastSave = ref<Date>(new Date(localStorage.getItem('lastSave') ?? ''))
  const lastEdit = ref<Date>(new Date(localStorage.getItem('lastEdit') ?? ''))
  const isDebugMode = ref<boolean>(false)
  const gameDataStore = useGameDataStore()

  // Watch the factories array for changes
  watch(factories, () => {
    localStorage.setItem('factories', JSON.stringify(factories.value))
    setLastEdit() // Update last edit time whenever the data changes, from any source.
  }, { deep: true })

  // This function is needed to ensure that data fixes are applied as we migrate things and change things around.
  const getFactories = () => {
    // Patch for old data pre #116
    factories.value.forEach(factory => {
      if (!factory.exports) {
        factory.exports = {}
      }
    })

    return factories.value
  }
  const getLastEdit = () => {
    return lastEdit.value
  }

  // Define actions
  const addFactory = (factory: Factory) => {
    factories.value.push(factory)
  }

  const removeFactory = (id: number) => {
    const index = getFactories().findIndex(factory => factory.id === id)
    if (index !== -1) {
      factories.value.splice(index, 1)
    }
  }

  const setLoggedInUser = (username: string) => {
    loggedInUser.value = username ?? ''
    if (username === '') {
      localStorage.removeItem('loggedInUser')
    } else {
      localStorage.setItem('loggedInUser', username)
    }
  }

  const setToken = (tokenValue: string) => {
    token.value = tokenValue ?? ''
    if (tokenValue === '') {
      localStorage.removeItem('token')
    } else {
      localStorage.setItem('token', tokenValue)
    }
  }

  const setFactories = (newFactories: Factory[]) => {
    console.log('Setting factories', newFactories)
    const gameData = gameDataStore.getGameData()
    if (!gameData) {
      console.error('Unable to load game data!')
      return
    }

    factories.value = newFactories
    // Trigger calculations
    calculateFactories(factories.value, gameData)
    // Will also call the watcher.
  }

  const clearFactories = () => {
    factories.value.length = 0
    factories.value = []
  }

  const setLastEdit = () => {
    lastEdit.value = new Date()
    localStorage.setItem('lastEdit', lastEdit.value.toISOString())
  }
  const setLastSave = () => {
    lastSave.value = new Date()
    localStorage.setItem('lastSave', lastSave.value.toISOString())
  }

  const debugMode = () => {
    const route = useRoute()

    if (window.location.hostname !== 'satisfactory-factories.app') {
      return true
    }
    return route.query.debug === 'true'
  }

  isDebugMode.value = debugMode()

  // Return state, actions, and getters
  return {
    factories,
    loggedInUser,
    token,
    lastSave,
    lastEdit,
    isDebugMode,
    getFactories,
    getLastEdit,
    addFactory,
    removeFactory,
    clearFactories,
    setLoggedInUser,
    setToken,
    setLastSave,
    setLastEdit,
    setFactories,
  }
})
