import { beforeAll, describe, expect, it, test } from '@jest/globals'
import {processFile} from '@/processor'
// import { createNewPart } from '@/utils/factory-management/common'
// import { newFactory } from '@/utils/factory-management/factory'
// import { addProductToFactory } from '@/utils/factory-management/products'

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
            // console.log('parts:');
            // console.log(results.items.parts);
            // const partsLength = results?.items ? Object.keys(results.items).length : 0;
            // console.log(partsLength);

            //assert
            expect(Object.keys(results.items.parts).length).toBe(168);
        })

        test('recipe test', () => {
            //arrange

            //act

            //assert
            expect(results.recipes.length).toBe(293);
        })


        // test('recipe ingredients and products test', () => {
        //     //arrange

        //     //act

        //     //assert
        //     //console.log(results.items.parts);
        //     // verify that each recipe has ingredients and products that exist in the parts list
        //     for (const recipe of results.recipes) {

        //         // for each recipe, check that each ingredient exists in the parts list
        //         for (const ingredient of recipe.ingredients) {
        //             //console.log(ingredient.part);
        //             //console.log(recipe.ingredients);
        //             const partName = results.items.parts[ingredient.part].name;
                    
        //             // Check if the ingredient exists in the parts list
        //             if (partName in results.items.parts) {
        //                 expect(partName).toBeDefined();
        //             } else {
        //                 //console.error(`Part ${ingredient.part} not found in parts list`);
        //                 expect(`Part ${ingredient.part} not found in parts list`).toBe("");
        //             }
        //         }

        //         // for each recipe, check that each product exists in the parts list





        //     //   for (const ingredient of recipe.ingredients) {
                
        //     //     const partName = ingredient.part;
        //     //     // Check if the part name exists in the parts list
        //     //     if (partName in results.items.parts) {
        //     //       const part = results.items.parts[partName];
        //     //       console.log(`Part key: ${partName}, Part details:`, part);
        //     //       expect(part).toBeDefined();
        //     //     } else {
        //     //       console.error(`Part ${partName} not found in parts list`);
        //     //       expect(`Part ${partName} not found in parts list`).toBe("");
        //     //     }
        //     //   }
        //         // for (const ingredient of recipe.ingredients) {
        //         //     const part = results.items.parts[ingredient.part];
        //         //     // Check if the ingredient exists in the parts list
        //         //     if (part in results.items.parts) {
        //         //         expect(results.items.parts[part]).toBeDefined();
        //         //     } else if (part.name !== "Gift" && part.name !== "Snow") {
        //         //       console.log("recipe:");
        //         //       console.log(recipe);
        //         //       console.log("part:");
        //         //       console.log(part);
        //         //       console.log("ingredient.part:");
        //         //       console.log(ingredient.part);
        //         //       console.log("finished");
        //         //       expect(`In recipe '${recipe.displayName}', ingredient '${ingredient.part}' was not found in the parts list`).toBe("");
        //         //     }
        //         // }
        //         for (const product of recipe.products) {
        //             const part = results.items.parts[product.part];
        //             // Check if the product exists in the parts list
        //             if (part in Object.keys(results.items.parts)) {
        //                 expect(results.items.parts[part]).toBeDefined();
        //             } else if (part.name !== "Gift" && part.name !== "Snow") {
        //                 expect(`In recipe '${recipe.displayName}', product '${product.part}' was not found in the parts list`).toBe("");
        //               }
        //         }
        //     }
        // })

        test('buildings test', () => {
            //arrange

            //act
            // console.log('buildings:');
            // console.log(results.buildings);

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
            // First, scan all ingredients and products in all recipes to produce a list of parts that are used
            const parts = new Set<string>();
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

            console.log('Missing parts:');
            console.log(missingParts);
            console.log('Extra parts:', extraParts);
            expect(missingParts.length).toBe(0);
            expect(extraParts.length).toBe(0);

            expect(Object.keys(results.items.parts).length).toBe(parts.size);
            // Display the difference between the two lists
        });
    })
})
