// Utilities
import { defineStore } from 'pinia'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { reactive } from 'vue'

export const useAppStore = defineStore('app', {
  state: () => ({
    factories: reactive<Factory[]>(JSON.parse(localStorage.getItem('factories') || '[]') as Factory[]),
    loggedInUser: ref<string>(localStorage.getItem('loggedInUser') || ''),
    token: ref<string>(localStorage.getItem('token') || ''),
    lastSave: ref<Date>(localStorage.getItem('lastSave') || ''),
  }),
  getters: {
    getFactories: state => state.factories,
    getFactoryById: state => (id: string) => {
      return state.factories.find(factory => factory.id === id)
    },
    getLoggedInUser: state => state.loggedInUser,
    getToken: state => state.token,
  },
  actions: {
    addFactory (factory: Factory) {
      this.factories.push(factory)
    },
    removeFactory (id: string) {
      this.factories = this.factories.filter(factory => factory.id !== id)
    },
    updateFactory (factory: Factory) {
      const index = this.factories.findIndex(f => f.id === factory.id)
      this.factories[index] = factory
    },
    setLoggedInUser (username: string) {
      this.loggedInUser = username ?? ''
      localStorage.setItem('loggedInUser', username)
      if (username === '') {
        localStorage.removeItem('loggedInUser')
      }
    },
    setToken (token: string) {
      this.token = token ?? ''
      localStorage.setItem('token', token)
      if (token === '') {
        localStorage.removeItem('token')
      }
    },
    saveFactories (factoryData: Factory[]) {
      // Save the factories array to localStorage
      this.factories = factoryData
      this.lastSave = new Date()
      localStorage.setItem('factories', JSON.stringify(this.factoryData))
      localStorage.setItem('lastSave', JSON.stringify(this.lastSave))

      // Since the factory data is being watched by the auth module, it will automatically be saved to the server if the user is logged in.
    },
  },
})
