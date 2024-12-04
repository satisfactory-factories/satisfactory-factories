export interface RecipeItem {
  part: string;
  amount: number;
  perMin: number;
  isByProduct?: boolean;
}

export interface Recipe {
  id: string;
  displayName: string;
  ingredients: RecipeItem[];
  products: RecipeItem[];
  building: {
    name: string;
    power: number;
  }
  isAlternate: boolean;
  isFicsmas: boolean;
}

export interface PowerRecipe {
  id: string;
  displayName: string;
  ingredients: RecipeItem[];
  byproduct: RecipeItem | null;
  building: {
    name: string;
    power: number;
  }
}
