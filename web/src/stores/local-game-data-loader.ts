import { DataInterface } from '@/interfaces/DataInterface'

export const loadLocalGameData = () => ({
  gameData: JSON.parse(<string>localStorage.getItem('gameData') ?? 'null') as DataInterface | null,
  version: localStorage.getItem('localDataVersion') ?? null,
})
