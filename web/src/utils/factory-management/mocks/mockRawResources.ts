import { RawResource } from '@/interfaces/DataInterface'

export const mockRawResources: { [key: string]: RawResource } = {
  OreIron: {
    name: 'Iron Ore',
    limit: 92100,
  },
  OreCopper: {
    name: 'Copper Ore',
    limit: 36900,
  },
  Water: {
    name: 'Water',
    limit: 1000000000000,
  },
}
