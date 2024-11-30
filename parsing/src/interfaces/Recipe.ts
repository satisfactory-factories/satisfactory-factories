export interface Ingredient {
  part: string;
  amount: number;
  perMin: number;
}

export interface Product {
  part: string;
  amount: number;
  perMin: number;
  isByProduct?: boolean;
}

export interface Recipe {
  id: string;
  displayName: string;
  ingredients: Ingredient[];
  products: Product[];
  building: Building;
  isAlternate: boolean;
  isFicsmas: boolean;
}

export interface PowerGenerationRecipe {
  id: string;
  displayName: string;
  ingredients: Ingredient[];
  products: Product[];
  building: Building;
}

export interface Fuel {
  primaryFuel: string;
  supplementalResource: string;
  byProduct: string;
  byProductAmount: number;
}

export interface Building {
  name: string;
  power: number;
  minPower?: number;
  maxPower?: number;
}
