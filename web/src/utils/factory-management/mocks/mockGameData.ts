import { DataInterface } from '@/interfaces/DataInterface'
import { mockParts } from '@/utils/factory-management/mocks/mockParts'
import { mockRecipes } from '@/utils/factory-management/mocks/mockRecipes'
import { mockRawResources } from '@/utils/factory-management/mocks/mockRawResources'

export const mockGameData: DataInterface = {
  buildings: {},
  items: {
    collectables: {},
    rawResources: mockRawResources,
    parts: mockParts,
  },
  recipes: mockRecipes,
}
