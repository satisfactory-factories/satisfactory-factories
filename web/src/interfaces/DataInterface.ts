import { Recipe } from './Recipe'

export interface Part {
  name: string;
  stackSize: number;
  isFluid: boolean;
}

export interface RawResource {
  name: string;
  limit: number;
}

export interface DataInterface {
  buildings: { [key: string]: string };
  items: {
      parts: { [key: string]: Part };
      collectables: { [key: string]: string };
      rawResources: { [key: string]: RawResource };
  }
  recipes: Recipe[];
}
