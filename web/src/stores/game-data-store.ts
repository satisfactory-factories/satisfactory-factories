import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DataInterface } from '@/interfaces/DataInterface'
import { config } from '@/config/config'

export const useGameDataStore = defineStore('game-data', () => {
  const gameData = ref<DataInterface | null>(JSON.parse(<string>localStorage.getItem('gameData') ?? 'null'))
  const localDataVersion = ref<string | null>(localStorage.getItem('localDataVersion') ?? null)

  const dataVersion: string = config.dataVersion ?? ''

  if (!dataVersion) {
    throw new Error('No data version found in config!')
  }

  const loadGameData = async (): Promise<void> => {
    try {
      if (localDataVersion.value !== dataVersion || !gameData.value) {
        console.log('Game data not detected or outdated, loading it.')
        const response = await fetch(`/gameData_v${dataVersion}.json`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const fetchedData: DataInterface = await response.json()

        if (!fetchedData) {
          throw new Error('No data received!')
        }

        gameData.value = fetchedData
        localStorage.setItem('localDataVersion', dataVersion)
        localStorage.setItem('gameData', JSON.stringify(gameData.value))
      } else {
        console.log(`Game data V${dataVersion} detected, skipping load.`)
      }
    } catch (err) {
      console.error('Error loading game data:', err)
      gameData.value = null
    }
  }

  const getGameData = (): DataInterface | null => {
    return gameData.value
  }

  return { gameData, getGameData, loadGameData }
})
