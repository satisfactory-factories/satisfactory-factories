import { Recipe } from '@/interfaces/Recipe'

export const mockRecipes: Recipe[] = [
  {
    id: 'IngotIron',
    displayName: 'Iron Ingot',
    ingredients: [
      {
        part: 'OreIron',
        amount: 1,
        perMin: 30,
      },
    ],
    products: [
      {
        part: 'IronIngot',
        amount: 1,
        perMin: 30,
        isByProduct: false,
      },
    ],
    building: {
      name: 'smeltermk1',
      power: '4',
    },
    isAlternate: false,
    isFicsmas: false,
  },
  {
    id: 'IngotCopper',
    displayName: 'Copper Ingot',
    ingredients: [
      {
        part: 'OreCopper',
        amount: 1,
        perMin: 30,
      },
    ],
    products: [
      {
        part: 'CopperIngot',
        amount: 1,
        perMin: 30,
        isByProduct: false,
      },
    ],
    building: {
      name: 'smeltermk1',
      power: '4',
    },
    isAlternate: false,
    isFicsmas: false,
  },
  {
    id: 'IronPlate',
    displayName: 'Iron Plate',
    ingredients: [
      {
        part: 'IronIngot',
        amount: 3,
        perMin: 30,
      },
    ],
    products: [
      {
        part: 'IronPlate',
        amount: 2,
        perMin: 20,
        isByProduct: false,
      },
    ],
    building: {
      name: 'constructormk1',
      power: '2',
    },
    isAlternate: false,
    isFicsmas: false,
  },
  {
    id: 'IronRod',
    displayName: 'Iron Rod',
    ingredients: [
      {
        part: 'IronIngot',
        amount: 1,
        perMin: 15,
      },
    ],
    products: [
      {
        part: 'IronRod',
        amount: 1,
        perMin: 15,
        isByProduct: false,
      },
    ],
    building: {
      name: 'constructormk1',
      power: '4',
    },
    isAlternate: false,
    isFicsmas: false,
  },
  {
    id: 'LiquidFuel',
    displayName: 'Fuel',
    ingredients: [
      {
        part: 'LiquidOil',
        amount: 6,
        perMin: 60,
      },
    ],
    products: [
      {
        part: 'LiquidFuel',
        amount: 4,
        perMin: 40,
        isByProduct: false,
      },
      {
        part: 'PolymerResin',
        amount: 3,
        perMin: 30,
        isByProduct: true,
      },
    ],
    building: {
      name: 'oilrefinery',
      power: '17.5',
    },
    isAlternate: false,
    isFicsmas: false,
  },
  {
    id: 'AluminaSolution',
    displayName: 'Alumina Solution',
    ingredients: [
      {
        part: 'OreBauxite',
        amount: 12,
        perMin: 120,
      },
      {
        part: 'Water',
        amount: 18,
        perMin: 180,
      },
    ],
    products: [
      {
        part: 'AluminaSolution',
        amount: 12,
        perMin: 120,
        isByProduct: false,
      },
      {
        part: 'Silica',
        amount: 5,
        perMin: 50,
        isByProduct: true,
      },
    ],
    building: {
      name: 'oilrefinery',
      power: '8.5',
    },
    isAlternate: false,
    isFicsmas: false,
  },
]
