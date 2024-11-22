import { beforeEach, describe, expect, test } from '@jest/globals'
import { processFile } from '@/processor'
// import { createNewPart } from '@/utils/factory-management/common'
// import { newFactory } from '@/utils/factory-management/factory'
// import { addProductToFactory } from '@/utils/factory-management/products'

describe('common', () => {
//   let mockFactory: Factory

//   beforeEach(() => {
//     mockFactory = newFactory('Test Factory')
//     addProductToFactory(mockFactory, {
//       id: 'CompactedCoal',
//       amount: 1234,
//       recipe: 'CompactedCoal',
//     })
//   })

  describe('parsing tests', () => {
    test('parts test', async () => {
        //arrange
        const inputFile = '../parsing/game-docs.json';
        const outputFile = '../parsing/gameData.json';

        //act
        let parts = await processFile(inputFile, outputFile);
        console.log('parts:');
        console.log(Object.keys(parts));

        //assert
        expect(Object.keys(parts).length).toBe(162);
    })

    test('recipe test', () => {
        //arrange


        //act

        //assert
        expect(true).toBe(true);
    })

  })
})
