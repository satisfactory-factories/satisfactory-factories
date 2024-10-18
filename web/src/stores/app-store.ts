// Utilities
import { defineStore } from 'pinia'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { reactive } from 'vue'

export const useAppStore = defineStore('app', {
  state: () => ({
    factories: reactive<Factory[]>(JSON.parse(localStorage.getItem('factories') || '[]') as Factory[]),
    loggedInUser: ref<string>(localStorage.getItem('loggedInUser') || ''),
    token: ref<string>(localStorage.getItem('token') || ''),
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
      console.log('Setting logged in user to', username)
      this.loggedInUser = username ?? ''
      localStorage.setItem('loggedInUser', username)
      if (username === '') {
        localStorage.removeItem('loggedInUser')
      }
    },
    setToken (token: string) {
      console.log('Setting token to', token)
      this.token = token ?? ''
      localStorage.setItem('token', token)
      if (token === '') {
        localStorage.removeItem('token')
      }
    },
    saveFactories (factoryData: Factory[]) {
      // Save the factories array to localStorage
      this.factories = factoryData
      localStorage.setItem('factories', JSON.stringify(factoryData))

      // If the user is logged in, save the factories to the database
      if (this.loggedInUser) {
        console.log('Saving factories to the database from store')
      }
    },
  },
})
