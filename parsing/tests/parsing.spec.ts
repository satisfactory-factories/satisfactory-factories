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

    test('buildings test', () => {
        //arrange

        //act
        console.log('buildings:');
        console.log(results.buildings);

        //assert
        expect(Object.keys(results.buildings).length).toBe(12);
    })

  })
})
