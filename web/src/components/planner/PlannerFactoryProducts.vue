<template>
  <div>
    <h1 class="text-h6 text-md-h5 mb-4">
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
    <!-- PRODUCTS -->
    <div
      v-for="(product, productIndex) in factory.products"
      :key="productIndex"
      class="px-4 my-2 border-md rounded sub-card product"
    >
      <div class="selectors mt-3 d-flex flex-column flex-md-row ga-3">
        <div class="input-row d-flex align-center">
          <span v-show="!product.id" class="mr-2">
            <i class="fas fa-cube" style="width: 32px; height: 32px" />
          </span>
          <span v-if="product.id" class="mr-2">
            <game-asset
              :key="product.id"
              height="42px"
              :subject="product.id"
              type="item"
              width="42px"
            />
          </span>
          <v-autocomplete
            v-model="product.id"
            hide-details
            :items="autocompletePartItems"
            label="Item"
            max-width="300px"
            variant="outlined"
            width="300px"
            @update:model-value="updateProductSelection(product, factory)"
          />
        </div>
        <div class="input-row d-flex align-center">
          <i class="fas fa-hat-chef mr-2" style="width: 32px; height: 32px" />
          <v-autocomplete
            v-model="product.recipe"
            :disabled="!product.id"
            hide-details
            :items="getRecipesForPartSelector(product.id)"
            label="Recipe"
            max-width="350px"
            variant="outlined"
            width="350px"
            @update:model-value="updateFactory(factory)"
          />
        </div>
        <div class="input-row d-flex align-center">
          <v-text-field
            v-model.number="product.amount"
            hide-details
            label="Qty /min"
            :max-width="smAndDown ? undefined : '110px'"
            :min-width="smAndDown ? undefined : '100px'"
            type="number"
            variant="outlined"
            @input="updateFactory(factory)"
          />
        </div>
        <div class="input-row d-flex align-center">
          <v-btn
            v-if="!factory.parts[product.id]?.satisfied"
            class="rounded mr-2"
            color="green"
            @click="fixProduction(factory, product.id)"
          ><i class="fas fa-wrench" /><span class="ml-1">Fix Production</span>
          </v-btn>
          <v-btn
            v-if="factory.dependencies.metrics[product.id]?.difference < 0"
            class="rounded mr-2"
            color="green"
            @click="fixExport(factory, product.id)"
          ><i class="fas fa-wrench" /><span class="ml-1">Fix Production</span>
          </v-btn>
          <v-btn
            v-show="shouldShowTrim(product, factory)"
            class="rounded mr-2"
            color="yellow"
            prepend-icon="fas fa-arrow-down"
            size="default"
            @click="doTrimProduct(product, factory)"
          >Trim</v-btn>
          <v-btn
            class="rounded mr-2"
            color="blue"
            :disabled="product.displayOrder === 0"
            icon="fas fa-arrow-up"
            size="small"
            variant="outlined"
            @click="updateProductOrder('up', product)"
          />
          <v-btn
            class="rounded mr-2"
            color="blue"
            :disabled="product.displayOrder === factory.products.length - 1"
            icon="fas fa-arrow-down"
            size="small"
            variant="outlined"
            @click="updateProductOrder('down', product)"
          />
          <v-btn
            class="rounded"
            color="red"
            icon="fas fa-trash"
            size="small"
            variant="outlined"
            @click="deleteProduct(productIndex, factory)"
          />
          <v-chip v-if="factory.internalProducts[product.id]" class="ml-2" color="sf-chip small green">
            Internal
          </v-chip>
          <v-chip v-if="shouldShowNotInDemand(product, factory)" class=" ml-2 sf-chip small red">
            Not in demand!
          </v-chip>
        </div>
      </div>
      <v-row
        v-if="product.byProducts && product.byProducts.length > 0"
        class="my-2 mb-n1 px-2 text-body-1 d-flex align-center"
      >
        <p class="mr-2">Byproduct:</p>
        <v-chip
          v-for="byProduct in product.byProducts"
          :key="byProduct.id"
          class="sf-chip"
        >
          <game-asset :subject="byProduct.id" type="item" />
          <span class="ml-2">
            <b>{{ getPartDisplayName(byProduct.id) }}</b>: {{ formatNumber(byProduct.amount) }}/min
          </span>
        </v-chip>
      </v-row>
      <v-row
        v-if="Object.keys(product.requirements).length > 0 || product.buildingRequirements.amount > 0"
        class="my-2 px-2 text-body-1 d-flex align-center"
      >
        <p class="mr-2">Requires:</p>
        <v-chip
          v-for="(requirement, part) in product.requirements"
          :key="`ingredients-${part}`"
          class="sf-chip blue"
          variant="tonal"
        >
          <game-asset :subject="part.toString()" type="item" />
          <span class="ml-2">
            <b>{{ getPartDisplayName(part.toString()) }}</b>: {{ formatNumber(requirement.amount) }}/min
          </span>
        </v-chip>
        <div v-if="product.buildingRequirements.name" class="ml-0 text-body-1 d-inline">
          <span>
            <v-chip
              class="sf-chip orange"
              variant="tonal"
            >
              <game-asset :subject="product.buildingRequirements.name" type="building" />
              <span class="ml-2">
                <b>{{ getBuildingDisplayName(product.buildingRequirements.name) }}</b>:
              </span>
              <v-text-field
                v-model.number="product.buildingRequirements.amount"
                class="inline-inputs"
                flat
                hide-details
                hide-spin-buttons
                min="0"
                :product="product.id"
                type="number"
                width="60px"
                @input="increaseProductQtyByBuilding(product)"
              />
            </v-chip>
            <v-chip
              class="sf-chip yellow"
              variant="tonal"
            >
              <i class="fas fa-bolt" />
              <span class="ml-2">
                {{ formatNumber(product.buildingRequirements.powerConsumed ?? 0) }} MW
              </span>
            </v-chip>
          </span>
        </div>
      </v-row>
    </div>
    <div class="mt-2">
      <v-btn
        color="primary mr-2"
        prepend-icon="fas fa-cube"
        ripple
        variant="flat"
        @click="addEmptyProduct(factory)"
      >
        Add Product
      </v-btn>
      <!-- END PRODUCTS -->
      <!-- POWER PRODUCERS -->
      <div
        v-for="(producer, producerIndex) in factory.powerProducers"
        :key="producerIndex"
        class="powerProduct px-4 my-2 border-md rounded sub-card"
      >
        <div class="selectors mt-3 d-flex flex-column flex-md-row ga-3">
          <div class="input-row d-flex align-center">
            <span v-show="!producer.building" class="mr-2">
              <i class="fas fa-building" style="width: 42px; height: 42px" />
            </span>
            <span v-if="producer.building" class="mr-2">
              <game-asset
                :key="producer.building"
                height="42px"
                :subject="producer.building"
                type="building"
                width="42px"
              />
            </span>
            <v-autocomplete
              v-model="producer.building"
              hide-details
              :items="autocompletePowerProducerGenerator()"
              label="Generator"
              max-width="250px"
              variant="outlined"
              width="250px"
              @update:model-value="updatePowerProducerSelection('building', producer, factory)"
            />
          </div>
          <div class="input-row d-flex align-center">
            <span v-if="producer.recipe" class="mr-2">
              <game-asset
                :key="producer.recipe"
                height="42px"
                :subject="getItemFromFuelRecipe(producer.recipe)"
                type="item"
                width="42px"
              />
            </span>
            <span v-else class="mr-2">
              <i class="fas fa-burn" style="width: 42px; height: 42px" />
            </span>
            <v-autocomplete
              v-model="producer.recipe"
              :disabled="!producer.building"
              hide-details
              :items="getRecipesForPowerProducerSelector(producer.building)"
              label="Fuel"
              max-width="235px"
              variant="outlined"
              width="235px"
              @update:model-value="updatePowerProducerSelection('recipe', producer, factory)"
            />
          </div>
          <div class="input-row d-flex align-center">
            <v-text-field
              v-model.number="producer.ingredientAmount"
              :disabled="!producer.recipe"
              hide-details
              label="Fuel Qty/min"
              :max-width="smAndDown ? undefined : '110px'"
              min="0"
              :min-width="smAndDown ? undefined : '100px'"
              type="number"
              variant="outlined"
              @update:model-value="updatePowerProducerFigures('ingredient', producer, factory)"
            />
          </div>
          <div class="d-flex align-center mx-1 font-weight-bold"><span>OR</span></div>
          <div class="input-row d-flex align-center">
            <v-text-field
              v-model.number="producer.powerAmount"
              :disabled="!producer.recipe"
              hide-details
              label="MW"
              :max-width="smAndDown ? undefined : '110px'"
              min="0"
              :min-width="smAndDown ? undefined : '100px'"
              type="number"
              variant="outlined"
              @update:model-value="updatePowerProducerFigures('power', producer, factory)"
            />
          </div>
          <div class="input-row d-flex align-center">
            <v-btn
              class="rounded mr-2"
              color="blue"
              :disabled="producer.displayOrder === 0"
              icon="fas fa-arrow-up"
              size="small"
              variant="outlined"
              @click="updatePowerProducerOrder('up', producer)"
            />
            <v-btn
              class="rounded mr-2"
              color="blue"
              :disabled="producer.displayOrder === factory.powerProducers.length - 1"
              icon="fas fa-arrow-down"
              size="small"
              variant="outlined"
              @click="updatePowerProducerOrder('down', producer)"
            />
            <v-btn
              class="rounded"
              color="red"
              icon="fas fa-trash"
              size="small"
              variant="outlined"
              @click="deletePowerProducer(producerIndex, factory)"
            />
          </div>
          <div class="input-row d-flex align-center">
            <v-chip
              class="sf-chip small green"
              variant="tonal"
            >
              <i class="fas fa-solar-panel" />
              <span class="ml-2">
                Produces: {{ formatNumber(producer.powerAmount) }} MW
              </span>
            </v-chip>
          </div>
        </div>
        <v-row
          v-if="producer.recipe"
          class="my-2 px-2 text-body-1 d-flex align-center"
        >
          <p class="mr-2">Requires:</p>
          <v-chip
            v-if="producer.ingredients[1]?.perMin > 0"
            class="sf-chip blue"
            variant="tonal"
          >
            <game-asset :subject="producer.ingredients[1].part" type="item" />
            <span class="ml-2">
              <b>{{ getPartDisplayName(producer.ingredients[1].part.toString()) }}</b>: {{ formatNumber(producer.ingredients[1].perMin) }}/min
            </span>
          </v-chip>
          <div v-if="producer.recipe" class="ml-0 text-body-1 d-inline">
            <span>
              <v-chip
                class="sf-chip orange"
                variant="tonal"
              >
                <game-asset :subject="producer.building" type="building" />
                <span class="ml-2">
                  <b>{{ getBuildingDisplayName(producer.building) }}</b>:
                </span>
                <v-text-field
                  v-model.number="producer.buildingAmount"
                  class="inline-inputs"
                  flat
                  hide-details
                  hide-spin-buttons
                  min="0"
                  type="number"
                  width="60px"
                  @input="updatePowerProducerFigures('building', producer, factory)"
                />
              </v-chip>
            </span>
          </div>
        </v-row>
      </div>
      <v-btn
        color="yellow-darken-3 mr-2"
        prepend-icon="fas fa-bolt"
        ripple
        variant="flat"
        @click="addEmptyPowerProducer(factory)"
      >
        Add Power Generator
      </v-btn>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { Factory, FactoryItem, FactoryPowerProducer } from '@/interfaces/planner/FactoryInterface'
  import {
    addProductToFactory,
    shouldShowNotInDemand,
    shouldShowTrim,
    trimProduct,
  } from '@/utils/factory-management/products'
  import { getPartDisplayName } from '@/utils/helpers'
  import { formatNumber } from '@/utils/numberFormatter'
  import { useGameDataStore } from '@/stores/game-data-store'
  import { useDisplay } from 'vuetify'
  import { PowerRecipe } from '@/interfaces/Recipes'

  const getBuildingDisplayName = inject('getBuildingDisplayName') as (part: string) => string
  const updateFactory = inject('updateFactory') as (factory: Factory) => void
  const fixProduction = inject('fixProduction') as (factory: Factory, partIndex: string) => void
  const fixExport = inject('fixExport') as (factory: Factory, productId: string) => void

  const props = defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  const { smAndDown } = useDisplay()
  const gameDataStore = useGameDataStore()

  const {
    getPowerRecipeById,
    getRecipesForPart,
    getRecipesForPowerProducer,
    getDefaultRecipeForPart,
    getDefaultRecipeForPowerProducer,
  } = useGameDataStore()

  const addEmptyProduct = (factory: Factory) => {
    addProductToFactory(factory, {
      id: '',
      amount: 1,
    })
  }

  const addEmptyPowerProducer = (factory: Factory) => {
    factory.powerProducers.push({
      building: '',
      buildingAmount: 0,
      buildingCount: 0,
      ingredientAmount: 0,
      ingredients: [],
      powerAmount: 0,
      powerProduced: 0,
      recipe: '',
      byproduct: null,
      displayOrder: factory.powerProducers.length,
      updated: 'power',
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

  const deletePowerProducer = (index: number, factory: Factory) => {
    factory.powerProducers.splice(index, 1)

    // We need to loop through each one in order and fix their ordering with the running count
    factory.powerProducers.forEach((producer, index) => {
      producer.displayOrder = index
    })
    updateFactory(factory)
  }

  const autocompletePartItemsGenerator = () => {
    const gameDataParts = gameDataStore.getGameData().items.parts
    const data = Object.keys(gameDataParts).map(part => {
      return {
        title: getPartDisplayName(part),
        value: part,
      }
    })
    data.sort((a, b) => a.title.localeCompare(b.title))

    return data
  }
  const autocompletePowerProducerGenerator = (): {title: string, value: string}[] => {
    // Loop through all the power production recipes and extrapolate a list of buildings.
    // We're going to use a set here to ensure the list is unique.
    const buildings = new Set<string>()

    gameDataStore.getGameData().powerGenerationRecipes.forEach(recipe => {
      buildings.add(recipe.building.name)
    })

    const buildingsArray: string[] = buildings.values().toArray()

    // Sort
    buildingsArray.sort((a, b) => a.localeCompare(b))

    const data = buildingsArray.map(building => {
      return {
        title: getBuildingDisplayName(building),
        value: building,
      }
    })
    return data ?? []
  }

  const autocompletePartItems = autocompletePartItemsGenerator()

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

  const getRecipesForPowerProducerSelector = (part: string) => {
    return getRecipesForPowerProducer(part).map(recipe => {
      // Each recipe has a bit of a weird displayName where it repeats the building name and the item it's using.
      // We want to shorten this to just the item name.
      // E.g. "Nuclear Power Plant (Ficsonium Fuel Rod) -> Ficsonium Fuel Rod"
      return {
        title: recipe.displayName.split('(')[1].split(')')[0],
        value: recipe.id,
      }
    })
  }

  const getItemFromFuelRecipe = (recipe: string) => {
    const fuelRecipe = getPowerRecipeById(recipe)
    if (!fuelRecipe) {
      return ''
    }

    return fuelRecipe.ingredients[0].part
  }

  const updateProductSelection = (product: FactoryItem, factory: Factory) => {
    product.recipe = getDefaultRecipeForPart(product.id)
    product.amount = 1

    updateFactory(factory)
  }

  const updatePowerProducerSelection = (source: 'building' | 'recipe', producer: FactoryPowerProducer, factory: Factory) => {
    let recipe: PowerRecipe | null = getDefaultRecipeForPowerProducer(producer.building)

    // Replace the recipe with the one newly selected
    if (source === 'recipe') {
      recipe = getPowerRecipeById(producer.recipe)
    }

    if (!recipe) {
      console.error('No recipe found for power producer!', producer)
      alert('Unable to find recipe for power generator! Please report this to Discord!')
      return
    }

    producer.recipe = recipe.id
    producer.ingredients = recipe.ingredients
    producer.powerAmount = 0
    producer.ingredientAmount = 0

    // Patch the ingredients to be zeroed
    producer.ingredients.forEach(ingredient => {
      ingredient.perMin = 0
    })

    updateFactory(factory)
  }

  const updatePowerProducerFigures = (type: 'ingredient' | 'power' | 'building', producer: FactoryPowerProducer, factory: Factory) => {
    producer.updated = type

    // If user has tried to enter zeros for any inputs, zero it
    if (producer.ingredientAmount === 0) {
      producer.ingredientAmount = 0
    }
    if (producer.powerAmount === 0) {
      producer.powerAmount = 0
    }
    updateFactory(factory)
  }

  const updateOrder = (list: any[], direction: 'up' | 'down', item: any) => {
    const index = list.findIndex(p => p.displayOrder === item.displayOrder)
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= list.length) {
      return
    }

    const otherItem = list.find(p => p.displayOrder === newIndex)
    if (!otherItem) {
      return
    }

    const tempOrder = item.displayOrder
    item.displayOrder = otherItem.displayOrder
    otherItem.displayOrder = tempOrder

    list.sort((a, b) => a.displayOrder - b.displayOrder)
  }

  // Enables the user to move the order of the byproduct up or down
  const updateProductOrder = (direction: 'up' | 'down', product: FactoryItem) => {
    updateOrder(props.factory.products, direction, product)
  }

  const updatePowerProducerOrder = (direction: 'up' | 'down', producer: FactoryPowerProducer) => {
    updateOrder(props.factory.powerProducers, direction, producer)
  }

  const increaseProductQtyByBuilding = (product: FactoryItem) => {
    // Get what is now the new buildingRequirement for the product
    const newVal = product.buildingRequirements.amount

    if (newVal < 0 || !newVal) {
      product.buildingRequirements.amount = 0 // Prevents the product being totally deleted
      return
    }

    // Get the recipe for the product in order to get the new quantity
    const recipe = gameDataStore.getRecipeById(product.recipe)

    if (!recipe) {
      console.error('No recipe found for product!', product)
      throw new Error('No recipe found for product!')
    }

    // Set the new quantity of the product
    product.amount = recipe.products[0].perMin * newVal

    updateFactory(props.factory)
  }

  const doTrimProduct = (product: FactoryItem, factory: Factory) => {
    trimProduct(product, factory)
    updateFactory(factory)
  }

</script>

<style lang="scss" scoped>
  .input-row {
    max-width: 100%;
  }

  .product {
    border-left: 5px solid #2196f3 !important
  }
  .powerProduct {
    border-left: 5px solid #ff9800 !important
  }
</style>
