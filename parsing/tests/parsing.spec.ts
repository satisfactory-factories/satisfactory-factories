import { beforeAll, beforeEach, describe, expect, test } from '@jest/globals'
import { processFile } from '@/processor'
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
        expect(Object.keys(results.items.parts).length).toBe(162);
    })

    test('recipe test', () => {
        //arrange


        //act

        //assert
        expect(results.recipes.length).toBe(293);
    })

    

    test('recipe ingredients and products exist test', () => {
      //arrange

      //act

      //assert
      // verify that each recipe has ingredients and products that exist in the parts list
      //console.log(results.recipes[0].ingredients)
      for (const recipe of results.recipes) {
        for (const ingredient of recipe.ingredients) {
          const partName = ingredient.part;
          // Check if the ingredient exists in the parts list
          if (partName in results.items.parts) {
              expect(results.items.parts[partName]).toBeDefined();
          } else {
            expect(`Recipe ingredient '${partName}' not found in parts list`).toBe("");
          }
        }
        for (const product of recipe.products) {
          const partName = product.part;
          // Check if the product exists in the parts list
          if (partName in results.items.parts) {
              expect(results.items.parts[partName]).toBeDefined();
          } else {
            expect(`Recipe product '${partName}' not found in parts list`).toBe("");
          }
        }
      }
  })

    test('buildings test', () => {
        //arrange

        //act
        // console.log('buildings:');
        // console.log(results.buildings);

        //assert
        expect(Object.keys(results.buildings).length).toBe(12);
        expect(results.buildings).toStrictEqual({
            blender: 75,
            constructormk1: 4,
            converter: 0.1, // TODO: This isn't right, it has a variable power consumption
            foundrymk1: 16,
            hadroncollider: 0.1,  // TODO: This isn't right, it has a variable power consumption
            manufacturermk1: 55,
            nuclearpowerplant: 0, // TODO: Nuclear Power Generates power, it doesn't consume
            oilrefinery: 30,
            packager: 10,
            quantumencoder: 0.1,  // TODO: This isn't right, it has a variable power consumption
            smeltermk1: 4,
        })
    })

  })
})
