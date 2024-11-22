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

  const getRecipesForPart = (part: string) => {
    if (!gameData.value || !part) {
      return []
    }

    return gameData.value.recipes.filter(recipe => {
      // Filter the recipe product array to return only the recipes that produce the part
      return recipe.products.filter(product => product.part === part).length > 0
    })
  }

  const getDefaultRecipeForPart = (part: string) => {
    const recipes = getRecipesForPart(part)
    if (recipes.length === 1) {
      return recipes[0].id
    }

    const exactRecipe = recipes.find(recipe => recipe.id === part)
    if (exactRecipe) {
      return exactRecipe.id
    } else {
      const defaultRecipes = recipes.filter(recipe => !recipe.isAlternate)
      if (defaultRecipes.length === 1) {
        return defaultRecipes[0].id
      }
    }

    return ''
  }

  return {
    gameData,
    getGameData,
    loadGameData,
    getRecipesForPart,
    getDefaultRecipeForPart,
  }
})
