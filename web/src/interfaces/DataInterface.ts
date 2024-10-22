import { Recipe } from './Recipe.ts'

export interface RawResource {
    name: string;
    limit: number;
}

export interface DataInterface {
    buildings: { [key: string]: string };
    items: {
        parts: { [key: string]: string };
        collectables: { [key: string]: string };
        rawResources: { [key: string]: RawResource };
    }
    recipes: Recipe[];
}
