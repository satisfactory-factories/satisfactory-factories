import {Recipe} from "./Recipe.ts";

export interface DataInterface {
    buildings: { [key: string]: string };
    items: {
        parts: { [key: string]: string };
        worldResources: { [key: string]: string };
    }
    recipes: Recipe[];
}