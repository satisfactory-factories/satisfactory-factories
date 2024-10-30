import { useGameDataStore } from '@/stores/game-data-store'

const gameDataStore = useGameDataStore()
await gameDataStore.loadGameData()
const gameData = gameDataStore.getGameData()

export const getPartDisplayName = (part: string | number | null): string => {
  if (!part) {
    return 'NO PART!!!'
  }
  if (!gameData) {
    console.error('getPartDisplayName: No game data!!')
    return 'NO DATA!!!'
  }
  return gameData.items.rawResources[part]?.name ||
    gameData.items.parts[part]?.name ||
    `UNKNOWN PART ${part}!`
}
