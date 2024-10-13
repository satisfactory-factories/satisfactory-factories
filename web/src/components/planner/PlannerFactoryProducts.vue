<template>
  <div>
    <h1 class="text-h5 mb-4">
      <i class="fas fa-conveyor-belt-alt" />
      <span class="ml-3">Products</span>
    </h1>
    <p v-show="helpText" class="text-body-2 mb-4">
      <i class="fas fa-info-circle" /> Products that are created within the factory. Products are first
      used to fulfil recipes internally, and any surplus is then shown in Outputs for export or
      sinking.<br>
      e.g. if you add 200 Iron Rods and also 100 Screws, you'd have 100 surplus Rods remaining used as an
      Output (and the Screws).<br>
      This way you know exactly how much of a part you need to make to fulfil both the factory itself and
      any other factories that use this one as an Input.
    </p>
    <v-row
      v-for="(product, productIndex) in factory.products"
      :key="productIndex"
      style="padding: 0; margin: 10px 0"
    >
      <v-autocomplete
        v-model="product.id"
        class="mr-6"
        hide-details
        :items="autocompletePartItems"
        label="Item"
        max-width="400px"
        prepend-icon="fas fa-cube"
        variant="outlined"
        @update:model-value="updateProductSelection(product, factory)"
      />
      <v-autocomplete
        v-model="product.recipe"
        class="mr-2"
        :disabled="!product.id"
        hide-details
        :items="getRecipesForPartSelector(product.id)"
        label="Recipe"
        max-width="400px"
        prepend-icon="fas fa-hat-chef"
        variant="outlined"
        @update:model-value="updateFactory(factory)"
      />
      <v-text-field
        v-model.number="product.amount"
        class="mr-2"
        hide-details
        label="Amount"
        max-width="125px"
        type="number"
        variant="outlined"
        @input="updateFactory(factory)"
      />
      <v-btn
        color="red"
        icon="fas fa-trash"
        rounded="0"
        @click="deleteProduct(productIndex, factory)"
      />

    </v-row>
    <v-btn
      color="primary"
      prepend-icon="fas fa-cube"
      ripple
      variant="flat"
      @click="addEmptyProduct(factory)"
    >Add Product
    </v-btn>
  </div>
</template>
<script lang="ts" setup>
  import { Factory, FactoryProduct } from '@/interfaces/planner/Factory'
  import { DataInterface } from '@/interfaces/DataInterface'

  const updateFactory = inject('updateFactory') as (factory: Factory) => void

  const props = defineProps<{
    factory: Factory;
    gameData: DataInterface
    helpText: boolean;
  }>()

  const addEmptyProduct = (factory: Factory) => {
    factory.products.push({
      id: '',
      amount: 0,
    })
  }

  const deleteProduct = (outputIndex: number, factory: Factory) => {
    factory.products.splice(outputIndex, 1)
    updateFactory(factory)
  }

  const autocompletePartItemsGenerator = () => {
    // `props.gameData.items.parts` is assumed to be an object with key-value pairs.
    // We use `Object.entries` to get an array of key-value pairs for iteration.

    const data = Object.entries(props.gameData.items.parts).map(([value, title]) => {
      return {
        value,
        title,
      }
    })
    data.sort((a, b) => a.title.localeCompare(b.title))
    return data
  }
  const autocompletePartItems = autocompletePartItemsGenerator()

  const getRecipesForPart = (part: string) => {
    return props.gameData.recipes.filter(recipe => {
      return recipe.product[part] || undefined
    })
  }
  const getRecipesForPartSelector = (part: string) => {
    // Return each recipe in the format of { title: 'Recipe Name', value: 'Recipe ID' }
    return props.gameData.recipes
      .filter(recipe => recipe.product[part] || undefined)
      .map(recipe => {
        return {
          title: recipe.displayName,
          value: recipe.id,
        }
      })
  }

  const updateProductSelection = (product: FactoryProduct, group: Factory) => {
    // If the user update's the product within the item selection, we need to wipe the recipe otherwise the user could somehow put in invalid recipes for the product.
    product.recipe = ''

    // If there is only one recipe for the product just automatically select it
    const recipes = getRecipesForPart(product.id)
    if (recipes.length === 1) {
      product.recipe = recipes[0].id
    }
    updateFactory(group)
  }
</script>
