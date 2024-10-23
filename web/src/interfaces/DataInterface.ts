import { Recipe } from './Recipe.ts'

export interface Part {
  [key: string]: {
    name: string;
    stackSize: number;
    isFluid: boolean;
  }
}

export interface RawResource {
    name: string;
    limit: number;
}

export interface DataInterface {
    buildings: { [key: string]: string };
    items: {
        parts: Part;
        collectables: { [key: string]: string };
        rawResources: { [key: string]: RawResource };
    }
    recipes: Recipe[];
}
