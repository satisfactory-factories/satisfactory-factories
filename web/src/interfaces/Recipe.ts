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
    power: string | number; // TODO: Fix the data to make it string / floats
  }
  isAlternate: boolean;
  isFicsmas: boolean;
}
