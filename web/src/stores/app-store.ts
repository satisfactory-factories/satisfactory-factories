// Utilities
import { defineStore } from 'pinia'
import { Factory, FactoryTab } from '@/interfaces/planner/FactoryInterface'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  // Define state using Composition API
  const factoryTabs = ref<FactoryTab[]>(JSON.parse(localStorage.getItem('factoryTabs') ?? '[]') as FactoryTab[])

  if (factoryTabs.value.length === 0) {
    factoryTabs.value = [
      {
        id: 'default',
        name: 'Default',
        // Fill the tabs from the legacy factories array if present so no data gets lost
        factories: JSON.parse(localStorage.getItem('factories') ?? '[]'),
      },
    ]
  }

  const currentFactoryTabIndex = ref(0)
  const currentFactoryTab = computed(() => factoryTabs.value[currentFactoryTabIndex.value])

  const factories = computed({
    get () {
      return currentFactoryTab.value.factories
    },
    set (value) {
      currentFactoryTab.value.factories = value
    },
  })

  const loggedInUser = ref<string>(localStorage.getItem('loggedInUser') ?? '')
  const token = ref<string>(localStorage.getItem('token') ?? '')
  const lastSave = ref<Date>(new Date(localStorage.getItem('lastSave') ?? ''))
  const lastEdit = ref<Date>(new Date(localStorage.getItem('lastEdit') ?? ''))

  // Watch the factories array for changes
  watch(factoryTabs, () => {
    localStorage.setItem('factoryTabs', JSON.stringify(factoryTabs.value))
    setLastEdit() // Update last edit time whenever the data changes, from any source.
  }, { deep: true })

  // Define actions
  const addFactory = (factory: Factory) => {
    factories.value.push(factory)
  }

  const removeFactory = (id: number) => {
    const index = factories.value.findIndex(factory => factory.id === id)
    if (index !== -1) {
      factories.value.splice(index, 1)
    }
  }

  const updateFactory = (factory: Factory) => {
    const foundFactory = factories.value.find(f => f.id === factory.id)
    if (foundFactory) {
      Object.assign(foundFactory, factory)
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

  const addTab = () => {
    factoryTabs.value.push({
      id: crypto.randomUUID(),
      name: 'New Tab',
      factories: [],
    })

    currentFactoryTabIndex.value = factoryTabs.value.length - 1
  }

  const removeTab = (id: string) => {
    if (factoryTabs.value.length === 1) return

    const index = factoryTabs.value.findIndex(tab => tab.id === id)
    if (index !== -1) {
      factoryTabs.value.splice(index, 1)

      if (currentFactoryTabIndex.value === index) {
        currentFactoryTabIndex.value = index - 1
      }
    }
  }

  // Return state, actions, and getters
  return {
    currentFactoryTab,
    currentFactoryTabIndex,
    factoryTabs,
    factories,
    loggedInUser,
    token,
    lastSave,
    lastEdit,
    addFactory,
    removeFactory,
    updateFactory,
    setLoggedInUser,
    setToken,
    setLastSave,
    setLastEdit,
    setFactories,
    addTab,
    removeTab,
  }
})
