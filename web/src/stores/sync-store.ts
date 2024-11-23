import { defineStore } from 'pinia'
import { config } from '@/config/config'
import { BackendFactoryDataResponse } from '@/interfaces/BackendFactoryDataResponse'
import { useAuthStore } from '@/stores/auth-store'
import { useAppStore } from '@/stores/app-store'
import eventBus from '@/utils/eventBus'
import { ref } from 'vue'

export const useSyncStore = defineStore('sync', () => {
  const authStore = useAuthStore()
  const appStore = useAppStore()

  const apiUrl = config.apiUrl

  const dataSavePending = ref<boolean>(false)
  const dataLastSaved = ref<Date | null>(null)
  const stopSyncing = ref<boolean>(false) // Disable syncing until refactor code is in
  let syncInterval: NodeJS.Timeout

  const setupTick = () => {
    clearInterval(syncInterval) // Prevents double-clocking
    // Start interval to check if data needs to be saved
    syncInterval = setInterval(async () => {
      await tickSync()
    }, 10000)
    console.log('syncStore: Tick setup')
  }

  const tickSync = async () => {
    console.log('syncStore: Ticking...')
    if (stopSyncing.value) {
      console.warn('syncStore: Syncing is disabled.')
      return
    }
    if (dataSavePending.value) {
      console.debug('syncStore: Syncing...')
      await saveData()
    }
  }

  const getServerData = async (): Promise<BackendFactoryDataResponse | false> => {
    const token = await authStore.getToken()
    const response = await fetch(`${apiUrl}/load`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const object = await response.json()
    const data = object?.data

    if (!object) {
      throw new Error('Unable to retrieve data object properly.')
    }

    if (response.ok) {
      if (!data) {
        throw new Error('Data load responded weirdly!')
      }
      return data
    } else {
      console.error('Data load failed:', object)
      throw new Error('Backend server unreachable for data load!')
    }
  }

  const handleDataLoad = async (forceLoad = false) => {
    const token = await authStore.getToken()
    const isTokenValid = await authStore.validateToken(token)
    if (!isTokenValid) {
      return
    }

    let data: BackendFactoryDataResponse | boolean
    try {
      data = await getServerData()

      if (!data) {
        console.warn('No data found on server. Aborting data load.')
        return
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Data load failed:', error)
        alert(`Unable to complete data load due to a server error. Please report the following error to Discord: ${error.message}`)
      }
      return
    }

    if (!data) {
      console.warn('No data found in response. Could be the first time the user has logged in.')
      return
    }

    if (forceLoad) {
      console.log('Forcing data load...')
    }

    // Check for OOS
    if (!forceLoad && checkForOOS(data)) {
      return 'oos'
    }

    // Since it's not out of sync, and the local data is older than the remote, simply replace the data now.
    appStore.setFactories(data.data)
    return true
  }

  const checkForOOS = (data: BackendFactoryDataResponse): boolean => {
    const serverSaved = new Date(data.lastSaved)
    const clientEdited = appStore.getLastEdit()
    if (clientEdited < serverSaved) {
      console.warn('Local data is out of sync with server data.')
      return true
    }
    return false
  }

  // Sends the API request off to save the data.
  const saveData = async () => {
    if (stopSyncing.value) {
      console.warn('saveData: Syncing is disabled.')
      return
    }
    // If there's no detected changes, don't bother.
    if (!dataSavePending.value) {
      return
    }

    const token = await authStore.getToken()
    if (!token) {
      console.error('saveData: No token found!')
      return
    }

    const data = appStore.getFactories()
    if (!data) {
      console.warn('saveData: No data to save!')
      return
    }

    try {
      const response = await fetch(`${apiUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      })
      const object = await response.json()

      if (response.ok) {
        console.log('saveData: Data saved:', object)
        dataSavePending.value = false
        dataLastSaved.value = new Date()
        localStorage.setItem('lastEdit', dataLastSaved.value.toISOString())
        return true
      } else if (response.status === 500) {
        console.error('saveData: Data save failed:', object)
        stopSyncing.value = true
        alert(`There was an error saving your data with the server. Syncing has been disabled until page refresh in case of server outage. Please report this to Discord: "saveData: Server 500 error"`)
        return false
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Data save failed:', error)
        stopSyncing.value = true
        alert(`There was an error saving your data with the server. Syncing has been disabled until page refresh in case of server outage. Please report this to Discord" "saveData: Unexpected Response - ${error.message}"`)
      }
      return false
    }
  }

  const detectedChange = () => {
    console.log('syncStore: Detected change in data.')
    dataSavePending.value = true
  }

  eventBus.on('factoryUpdated', detectedChange)
  console.log('syncStore: Listening for changes...')

  return {
    dataSavePending,
    dataLastSaved,
    setupTick,
    tickSync,
    getServerData,
    handleDataLoad,
    checkForOOS,
    saveData,
    detectedChange,
  }
})
