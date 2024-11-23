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

    

    test('recipe ingredients and products test', () => {
      //arrange

      //act

      //assert
      // verify that each recipe has ingredients and products that exist in the parts list
      console.log(results.recipes[0].ingredients)
      // for (const recipe of results.recipes) {
      //   for (const ingredient of recipe.ingredients) {
      //     const part = results.items.parts[ingredient.part];
      //     expect(part).toBeDefined();
      //   }
      //   for (const product of recipe.products) {
      //     const part = results.items.parts[product.part];
      //     expect(part).toBeDefined();
      //   }
      // }
  })

    test('buildings test', () => {
        //arrange

        //act
        // console.log('buildings:');
        console.log(results.buildings);

        //assert
        expect(Object.keys(results.buildings).length).toBe(12);
        expect(results.buildings['assemblermk1']).toBe(15);
        expect(results.buildings['blender']).toBe(75);
        expect(results.buildings['constructormk1']).toBe(4);
        expect(results.buildings['converter']).toBe(0.1); //TODO: This isn't right, it has a variable power consumption
        expect(results.buildings['foundrymk1']).toBe(16);
        expect(results.buildings['hadroncollider']).toBe(0.1); //TODO: This isn't right, it has a variable power consumption
        expect(results.buildings['manufacturermk1']).toBe(55);
        expect(results.buildings['nuclearpowerplant']).toBe(0); // Nuclear Power Generates power, it doesn't consume
        expect(results.buildings['oilrefinery']).toBe(30);
        expect(results.buildings['packager']).toBe(10);
        expect(results.buildings['quantumencoder']).toBe(0.1); //TODO: This isn't right, it has a variable power consumption
        expect(results.buildings['smeltermk1']).toBe(4);
    })

  })
})
