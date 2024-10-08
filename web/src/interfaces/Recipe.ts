export interface Recipe {
  id: string;
  displayName: string;
  ingredients: { [key: string]: number }[];
  product: { [key: string]: number };
  perMin: number;
  isAlternate: boolean;
}