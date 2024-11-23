import { beforeAll, describe, expect, it, test } from '@jest/globals'
import {processFile} from '@/processor'

describe('common', () => {
    let results: any;

    beforeAll(async () => {
        //arrange
        const inputFile = '../parsing/game-docs.json';
        const outputFile = '../parsing/gameData.json';

        //act
        results = await processFile(inputFile, outputFile);

    })

    describe('parsing tests', () => {
        test('parts test', async () => {
            //arrange

            //act

            //assert
            expect(Object.keys(results.items.parts).length).toBe(167);
        })

        test('recipe test', () => {
            //arrange

            //act

            //assert
            expect(results.recipes.length).toBe(293);
        })


        test('buildings test', () => {
            //arrange

            //act

            //assert
            expect(Object.keys(results.buildings).length).toBe(12);
            expect(results.buildings).toStrictEqual({
                assemblermk1: 15,
                blender: 75,
                constructormk1: 4,
                converter: 0.1, // TODO: This needs to be corrected, it has a variable power consumption
                foundrymk1: 16,
                hadroncollider: 0.1,  // TODO: This needs to be corrected, it has a variable power consumption
                manufacturermk1: 55,
                nuclearpowerplant: 0, // TODO: Nuclear Power Generates power, it doesn't consume
                oilrefinery: 30,
                packager: 10,
                quantumencoder: 0.1,  // TODO: This needs to be corrected, it has a variable power consumption
                smeltermk1: 4,
            })
        })

    })

    // TODO: Resolve Turbofuel and Slug issues
    describe('Recipe tests', () => {
        it('should properly calculate the correct number of parts used and produced in recipes', () => {
            //arrange
            const parts = new Set<string>();

            //act
            // Scan all ingredients and products in all recipes to produce a list of parts that are used
            for (const recipe of results.recipes) {
                for (const ingredient of recipe.ingredients) {
                    parts.add(ingredient.part);
                }
                for (const product of recipe.products) {
                    parts.add(product.part);
                }
            }

            // Now we have our list of parts, asset that the number of parts we've generated actually match
            const partsList = Object.keys(results.items.parts);
            const missingParts = partsList.filter(part => !parts.has(part));
            const extraParts = Array.from(parts).filter(part => !partsList.includes(part));

            //assert
            console.log('Missing parts:');
            console.log(missingParts);
            console.log('Extra parts:', extraParts);
            expect(missingParts.length).toBe(0);
            expect(extraParts.length).toBe(0);

            expect(Object.keys(results.items.parts).length).toBe(parts.size);
        });
    })
})
