// Utilities
import { defineStore } from 'pinia'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  // Define state using Composition API
  const factories = ref<Factory[]>(JSON.parse(localStorage.getItem('factories') || '[]') as Factory[])
  const loggedInUser = ref<string>(localStorage.getItem('loggedInUser') || '')
  const token = ref<string>(localStorage.getItem('token') || '')
  const lastSave = ref<Date>(new Date(localStorage.getItem('lastSave') || ''))
  const lastEdit = ref<Date>(new Date(localStorage.getItem('lastEdit') || ''))

  // Getters
  const getFactory = (id: string) => {
    return factories.value.find(factory => factory.id === id)
  }
  const getFactories = () => {
    return factories.value
  }
  const getLastEdit = () => {
    return lastEdit.value
  }

  // Define actions
  const addFactory = (factory: Factory) => {
    factories.value.push(factory)
  }

  const removeFactory = (id: string) => {
    const index = factories.value.findIndex(factory => factory.id === id)
    if (index !== -1) {
      factories.value.splice(index, 1)
    }
  }

  const updateFactory = (factory: Factory) => {
    const index = factories.value.findIndex(f => f.id === factory.id)
    if (index !== -1) {
      factories[index] = factory
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
    factories.value = newFactories
    // Will also call the watcher.
  }

  const setLastEdit = () => {
    lastEdit.value = new Date()
    localStorage.setItem('lastEdit', lastEdit.value.toISOString())
  }
  const setLastSave = () => {
    lastSave.value = new Date()
    localStorage.setItem('lastSave', lastSave.value.toISOString())
  }
  // Watch the factories array for changes
  watch(factories, () => {
    localStorage.setItem('factories', JSON.stringify(factories.value))
    setLastEdit() // Update last edit time whenever the data changes, from any source.
  }, { deep: true })

  // Return state, actions, and getters
  return {
    factories,
    loggedInUser,
    token,
    lastSave,
    getFactory,
    getFactories,
    getLastEdit,
    addFactory,
    removeFactory,
    updateFactory,
    setLoggedInUser,
    setToken,
    setLastSave,
    setLastEdit,
    setFactories,
  }
})
