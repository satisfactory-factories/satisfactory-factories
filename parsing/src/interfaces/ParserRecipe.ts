export interface ParserIngredient {
  part: string;
  amount: number;
  perMin: number;
}

export interface ParserProduct {
  part: string;
  amount: number;
  perMin: number;
  isByProduct?: boolean;
}

export interface ParserRecipe {
  id: string;
  displayName: string;
  ingredients: ParserIngredient[];
  products: ParserProduct[];
  building: ParserBuilding;
  isAlternate: boolean;
  isFicsmas: boolean;
}

export interface ParserRecipeItem {
  part: string;
  amount: number;
  perMin: number;
  isByProduct?: boolean;
}

export interface ParserPowerRecipe {
  id: string;
  displayName: string;
  ingredients: ParserRecipeItem[];
  byproduct: ParserRecipeItem | null;
  building: {
    name: string;
    power: number;
  }
}

export interface ParserFuel {
  primaryFuel: string;
  supplementalResource: string;
  byProduct: string;
  byProductAmount: number;
}

export interface ParserBuilding {
  name: string;
  power: number;
  minPower?: number;
  maxPower?: number;
}
