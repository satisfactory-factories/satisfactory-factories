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
  perMin: number;
  producedIn: string[];
  powerPerBuilding: [{ building: string, powerPerBuilding: number }];
  isAlternate: boolean;
}
