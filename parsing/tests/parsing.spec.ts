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
    test('parts test', () => {
        //arrange
        const inputFile = '../game-docs.json';
        const outputFile = 'game-docs.json';

        //act
        let results = processFile(inputFile, outputFile);
        console.log(results.items.length);

        //assert
        expect(results.items.length).toBe(100);
    })

    test('recipe test', () => {
        //arrange


        //act

        //assert
        expect(true).toBe(true);
    })

  })
})
