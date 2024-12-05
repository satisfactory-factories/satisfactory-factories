export interface ParserIngredient {
  part: string;
  amount?: string;
  perMin: number;
  mwPerItem?: number;
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

export interface ParserPowerItem {
  part: string;
  perMin: number;
}

export interface ParserPowerRecipe {
  id: string;
  displayName: string;
  ingredients: ParserRecipeItem[];
  byproduct: ParserPowerItem | null;
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
  byProductPerMin: number;
  duration: number
}

export interface ParserBuilding {
  name: string;
  power: number;
  minPower?: number;
  maxPower?: number;
}
