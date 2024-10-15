<template>
  <div>
    <h1 class="text-h5 mb-4">
      <i class="fas fa-conveyor-belt-alt" />
      <span class="ml-3">Products</span>
    </h1>
    <p v-show="helpText" class="text-body-2 mb-4">
      <i class="fas fa-info-circle" /> Products that are created within the factory. Products are first
      used to fulfil recipes internally, and any surplus is then shown in Exports for export or
      sinking.<br>
      e.g. if you add 200 Iron Rods and also 100 Screws, you'd have 100 surplus Rods remaining used as an
      Export (and the Screws as a end product).<br>
      An <v-chip color="green">Internal</v-chip> product is one that is used to produce other products. The surplus of which can also be used as an export.
    </p>
    <div
      v-for="(product, productIndex) in factory.products"
      :key="productIndex"
      class="px-4 my-2 border rounded bg-grey-darken-4"
    >
      <v-row class="selectors align-center ml-0 mt-5 mb-4">
        <v-autocomplete
          v-model="product.id"
          class="mr-6"
          hide-details
          :items="autocompletePartItems"
          label="Item"
          max-width="300px"
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
          max-width="300px"
          prepend-icon="fas fa-hat-chef"
          variant="outlined"
          @update:model-value="updateFactory(factory)"
        />
        <v-text-field
          v-model.number="product.amount"
          class="mr-2"
          hide-details
          label="Qty /min"
          max-width="110px"
          type="number"
          variant="outlined"
          @input="updateFactory(factory)"
        />
        <v-btn
          class="rounded"
          color="blue"
          :disabled="product.displayOrder === 0"
          icon="fas fa-arrow-up"
          size="small"
          variant="outlined"
          @click="updateOrder('up', product)"
        />
        <v-btn
          class="rounded ml-1"
          color="blue"
          :disabled="product.displayOrder === factory.products.length - 1"
          icon="fas fa-arrow-down"
          size="small"
          variant="outlined"
          @click="updateOrder('down', product)"
        />
        <v-btn
          class="ml-6 rounded"
          color="red"
          icon="fas fa-trash"
          size="small"
          variant="outlined"
          @click="deleteProduct(productIndex, factory)"
        />
        <v-chip v-if="factory.internalProducts[product.id]" class="ml-2" color="green">
          Internal
        </v-chip>
      </v-row>
      <v-row v-show="Object.keys(product.requirements).length > 0" class="ml-0 mb-3 text-body-1">
        <div>
          <span class="font-weight-bold">Ingredients: </span>
          <v-chip
            v-for="(requirement, requirementIndex) in product.requirements"
            :key="`ingredients-${requirementIndex}`"
            class="mr-2 border-md"
            color="primary"
            prepend-icon="fa fa-cube"
            size="large"
            style="border-color: rgb(0, 93, 167) !important"
            variant="tonal"
          >
            <b>{{ getPartDisplayName(requirementIndex) }}</b>: {{ requirement.amount }}/min
          </v-chip>
        </div>
      </v-row>
      <v-row v-show="product.buildingRequirements.length > 0" class="ml-0 mb-3 text-body-1">
        <div>
          <span class="font-weight-bold">Buildings: </span>
          <span
            v-for="(building, buildingIndex) in product.buildingRequirements"
            :key="`buildings-${buildingIndex}`"
          >
            <v-chip
              class="mr-2 border-md"
              color="yellow-darken-4"
              prepend-icon="fas fa-building"
              size="large"
              style="border-color: rgb(167, 86, 0)!important"
              variant="tonal"
            >
              <b>{{ getBuildingDisplayName(building.name) }}</b>: {{ building.amount }}x
            </v-chip>
            <v-chip
              class="mr-2 border-md"
              color="yellow-darken-2"
              prepend-icon="fas fa-bolt"
              size="large"
              style="border-color: rgb(172, 153, 2) !important"
              variant="tonal"
            >
              <b>Power:</b>&nbsp; {{ building.totalPower }} MW
            </v-chip>
          </span>
        </div>
      </v-row>
    </div>
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
  import { Factory } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'

  const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string
  const getBuildingDisplayName = inject('getBuildingDisplayName') as (part: string) => string

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
      recipe: '',
      displayOrder: factory.products.length,
      requirements: {},
      buildingRequirements: [],
    })
  }

  const deleteProduct = (outputIndex: number, factory: Factory) => {
    factory.products.splice(outputIndex, 1)

    // We need to loop through each one in order and fix their ordering with the running count
    factory.products.forEach((product, index) => {
      product.displayOrder = index
    })
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
    // If there's "Alternate" in the name, shorten it to "Alt" for display.
    return getRecipesForPart(part).map(recipe => {
      return {
        title: recipe.displayName.replace('Alternate', 'Alt'),
        value: recipe.id,
      }
    })
  }

  const updateProductSelection = (product: FactoryProduct, factory: Factory) => {
    // If the user update's the product within the item selection, we need to wipe the recipe otherwise the user could somehow put in invalid recipes for the product.
    product.recipe = ''
    product.amount = 0

    // If there is only one recipe for the product just automatically select it
    const recipes = getRecipesForPart(product.id)
    if (recipes.length === 1) {
      product.recipe = recipes[0].id
    }

    updateFactory(factory)
  }

  // Enables the user to move the order of the products up or down
  const updateOrder = (direction: 'up' | 'down', product: FactoryProduct) => {
    const index = props.factory.products.findIndex(p => p.displayOrder === product.displayOrder)
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= props.factory.products.length) {
      return
    }

    const otherProduct = props.factory.products.find(p => p.displayOrder === newIndex)
    if (!otherProduct) {
      return
    }

    const tempOrder = product.displayOrder
    product.displayOrder = otherProduct.displayOrder
    otherProduct.displayOrder = tempOrder

    props.factory.products.sort((a, b) => a.displayOrder - b.displayOrder)
  }

</script>
