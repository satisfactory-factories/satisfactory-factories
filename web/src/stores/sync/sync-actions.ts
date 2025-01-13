import { BackendPlannerStateResponse } from '@/interfaces/BackendPlannerStateResponse'
import { config } from '@/config/config'
import { FactoryTab } from '@/interfaces/planner/FactoryInterface'

export class SyncActions {
  private readonly authStore: any
  private readonly appStore: any
  private readonly apiUrl: string

  constructor (authStore: any, appStore: any) {
    this.authStore = authStore
    this.appStore = appStore
    this.apiUrl = config.apiUrl
  }

  async loadServerData (forceLoad = false): Promise<'oos' | void | true> {
    const token = await this.authStore.getToken()
    const isTokenValid = await this.authStore.validateToken(token)
    if (!isTokenValid) {
      console.error('loadServerData: Token is invalid!')
      return
    }

    let dataObject: BackendPlannerStateResponse | false
    try {
      dataObject = await this.getServerData()

      if (!dataObject) {
        console.warn('loadServerData: No data found on server. Aborting data load.')
        return
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('loadServerData: Data load failed:', error)
        alert(`Unable to complete data load due to a server error. Please report the following error to Discord: ${error.message}`)
      }
      return
    }

    // Don't care about sync state if we're forcing a load
    if (forceLoad) {
      console.log('loadServerData: Forcing data load.')
      this.appStore.setTabs(dataObject.tabs)
      return true
    }

    const isOOS = this.checkForOOS(dataObject)
    console.log('loadServerData: OSS status:', isOOS)

    return isOOS ? 'oos' : undefined
  }

  async syncData (
    stopSyncing: boolean,
    dataSavePending: boolean
  ): Promise<boolean | void> {
    if (stopSyncing) {
      console.warn('syncData: Syncing is disabled.')
      return
    }
    if (!dataSavePending) {
      return
    }

    // Ask appStore if it's ready
    if (!this.appStore.isLoaded) {
      console.log('syncData: appStore is not ready, aborting.')
      return
    }

    try {
      const data = this.appStore.getTabs()
      await this.performSave(data)
    } catch (error) {
      if (error instanceof Error) {
        console.error('syncData: Token error:', error.message)
      }
    }
  }

  async performSave (data: FactoryTab[]): Promise<boolean | void> {
    const token = await this.authStore.getToken()

    if (!token) {
      throw new Error('syncData: performSave: No token!')
    }

    if (!data || !Object.keys(data).length) {
      console.warn('syncData: No data to save!')
      return false
    }

    let response: Response
    try {
      response = await fetch(`${this.apiUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = `syncData: performSave: Unexpected Response - ${error.message}`
        console.error(errorMessage, error)
        throw new Error(errorMessage)
      }
      return false
    }
    if (!response) {
      console.error('syncData: No response from server!')
      return false
    }
    const object = await response.json()

    if (response.ok) {
      console.log('syncData: Data saved:', object)
      return true
    } else if (response.status === 500 || response.status === 502) {
      throw new Error('syncData: performSave: Server 5xx error')
    }
  }

  async getServerData (): Promise<BackendPlannerStateResponse> {
    const token = await this.authStore.getToken()

    // Check if we need to do a migration, if so don't load the data as it's old.
    const needsMigration = await this.checkIfNeedsMigration()
    if (needsMigration) {
      console.log('syncData: getServerData: Migration required, doing it now.')
      await this.performSave(this.appStore.getTabs())
    }

    const response = await fetch(`${this.apiUrl}/load`, {
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

      return object
    } else {
      console.error('Data load failed:', object)
      throw new Error('Backend server unreachable for data load!')
    }
  }

  checkForOOS (data: BackendPlannerStateResponse): boolean {
    const serverSaved = new Date(data.lastSaved)
    const clientEdited = this.appStore.getLastEdit()
    if (clientEdited < serverSaved) {
      console.warn('Server data is ahead of remote, assuming out of sync.')
      return true
    }
    console.debug('Server data is behind client data, assuming local is correct.')

    return false
  }

  async checkIfNeedsMigration () {
    const token = await this.authStore.getToken()
    const response = await fetch(`${this.apiUrl}/needsStateMigration`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await response.json()
    if (response.ok) {
      if (data === true) {
        console.log('Migration required.')
        return true
      }
      console.log('No migration required.')
      return false
    } else {
      console.error('Migration check failed:', data)
      throw new Error('Backend server unreachable for migration check!')
    }
  }
}
