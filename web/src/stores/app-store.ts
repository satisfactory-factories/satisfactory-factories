// Utilities
import { defineStore } from 'pinia'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { reactive, ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  // Define state using Composition API
  const factories = reactive<Factory[]>(JSON.parse(localStorage.getItem('factories') || '[]') as Factory[])
  const loggedInUser = ref<string>(localStorage.getItem('loggedInUser') || '')
  const token = ref<string>(localStorage.getItem('token') || '')
  const lastSave = ref<Date>(new Date(localStorage.getItem('lastSave') || ''))

  // Define actions
  const addFactory = (factory: Factory) => {
    factories.push(factory)
  }

  const removeFactory = (id: string) => {
    const index = factories.findIndex(factory => factory.id === id)
    if (index !== -1) {
      factories.splice(index, 1)
    }
  }

  const updateFactory = (factory: Factory) => {
    const index = factories.findIndex(f => f.id === factory.id)
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
    this.factories = newFactories
  }

  const saveFactories = () => {
    lastSave.value = new Date()
    localStorage.setItem('factories', JSON.stringify(factories))
    localStorage.setItem('lastSave', lastSave.value.toISOString())

    // Additional save logic, e.g., saving to server if the user is logged in is handled by Auth.vue.
  }

  // Watch the factories array for changes
  watch(factories, () => {
    saveFactories() // Save whenever factories array changes
  }, { deep: true })

  // Return state, actions, and getters
  return {
    factories,
    loggedInUser,
    token,
    lastSave,
    addFactory,
    removeFactory,
    updateFactory,
    setLoggedInUser,
    setToken,
    setFactories,
    saveFactories,
  }
})
