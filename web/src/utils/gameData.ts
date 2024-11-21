import { DataInterface } from '@/interfaces/DataInterface'
import path from 'path'
import * as fs from 'node:fs'

// Provides the ability to load the game data directly as a constant, useful for testing purposes where we want to just inject the game data directly to it.

// Import the real game data from the file
const gameDataJSON = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../parsing/gameData.json'), 'utf-8')
)

export const gameData: DataInterface = gameDataJSON
