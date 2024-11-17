<template>
  <introduction :intro-show="introShow" @close-intro="closeIntro" @show-demo="setupDemo" />
  <div class="planner-container">
    <!-- The Drawer for Mobile -->
    <v-navigation-drawer
      v-model="drawer"
      app
      class="d-md-none"
      temporary
    >
      <v-divider color="#ccc" thickness="2px" />
      <planner-factory-list
        :factories="factories"
        :total-factories="factories.length"
        @create-factory="createFactory"
        @update-factories="updateFactories"
      />
      <planner-global-actions
        class="py-4"
        :help-text-shown="helpText"
        @clear-all="clearAll"
        @hide-all="showHideAll('hide')"
        @show-all="showHideAll('show')"
        @show-intro="showIntro"
        @toggle-help-text="toggleHelp()"
      />
    </v-navigation-drawer>
    <v-row class="two-pane-container">
      <!-- Sticky Sidebar for Desktop -->
      <v-col class="d-none d-md-flex sticky-sidebar">
        <v-container class="pa-0">
          <planner-factory-list
            :factories="factories"
            :total-factories="factories.length"
            @create-factory="createFactory"
            @update-factories="updateFactories"
          />
          <v-divider color="#ccc" thickness="2px" />
          <planner-global-actions
            class="py-2"
            :help-text-shown="helpText"
            @clear-all="clearAll"
            @hide-all="showHideAll('hide')"
            @show-all="showHideAll('show')"
            @show-intro="showIntro"
            @toggle-help-text="toggleHelp()"
          />
        </v-container>
      </v-col>
      <!-- Main Content Area -->
      <v-col class="border-s-md pa-3 main-content">
        <todo />
        <planner-world-resources
          :help-text="helpText"
          :world-raw-resources="worldRawResources"
        />
        <planner-factory
          v-for="(factory) in factories"
          :key="factory.id"
          :factory="factory"
          :game-data="gameData"
          :help-text="helpText"
          :total-factories="factories.length"
        />
        <div class="mt-4 text-center">
          <v-btn
            color="primary"
            prepend-icon="fas fa-plus"
            size="large"
            @click="createFactory()"
          >Add Factory</v-btn>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
  import { computed, defineProps, provide, reactive, ref, watch } from 'vue'

  import PlannerGlobalActions from '@/components/planner/PlannerGlobalActions.vue'
  import {
    ByProductItem,
    Factory,
    FactoryItem,
    WorldRawResource,
  } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'
  import Todo from '@/components/planner/Todo.vue'
  import { useAppStore } from '@/stores/app-store'
  import { storeToRefs } from 'pinia'
  import { calculateInputs } from '@/utils/factory-management/inputs'
  import { calculateByProducts, calculateInternalProducts, calculateProducts } from '@/utils/factory-management/products'
  import { calculateBuildingRequirements, calculateBuildingsAndPower } from '@/utils/factory-management/buildings'
  import { calculateRawSupply, calculateUsingRawResourcesOnly } from '@/utils/factory-management/supply'
  import { calculateFactorySatisfaction } from '@/utils/factory-management/satisfaction'
  import { calculateSurplus } from '@/utils/factory-management/surplus'
  import {
    calculateDependencyMetrics,
    constructDependencies,
    removeFactoryDependants,
  } from '@/utils/factory-management/dependencies'
  import { configureExportCalculator } from '@/utils/factory-management/exportCalculator'
  import { calculateHasProblem } from '@/utils/factory-management/problems'
  import { findFac, newFactory } from '@/utils/factory-management/factory'
  import { demoFactories } from '@/utils/demoFactories'

  const props = defineProps<{ gameData: DataInterface | null }>()

  const gameData = props.gameData
  if (!gameData) {
    console.error('No game data provided to Planner!')
    throw new Error('No game data provided to Planner!')
  }

  const appStore = useAppStore()
  const { factories } = storeToRefs(appStore)

  const worldRawResources = reactive<{ [key: string]: WorldRawResource }>({})
  const drawer = ref(false)
  const helpText = ref(localStorage.getItem('helpText') === 'true')

  // ==== WATCHES
  watch(helpText, newValue => {
    localStorage.setItem('helpText', JSON.stringify(newValue))
  })

  const createFactory = () => {
    const factory = newFactory()
    factory.displayOrder = factories.value.length
    factories.value.push(factory)
    navigateToFactory(factory.id)
  }

  const factoriesWithSurplus = computed(() => {
    // Loop through all factories and see if any have any surplus
    return factories.value.filter(factory => Object.keys(factory.surplus).length > 0)
  })

  // This function calculates the world resources available after each group has consumed Raw Resources.
  // This is done here globally as it loops all factories.value. It is not appropriate to be done on group updates.
  const updateWorldRawResources = (gameData: DataInterface): void => {
    // Generate fresh world resources as a baseline for calculation.
    Object.assign(worldRawResources, generateRawResources(gameData))

    // Loop through each group's products to calculate usage of raw resources.
    factories.value.forEach(factory => {
      factory.products.forEach(product => {
        const recipe = gameData.recipes.find(r => r.id === product.recipe)
        if (!recipe) {
          console.error(`Recipe with ID ${product.id} not found.`)
          return
        }

        // Loop through each ingredient in the recipe (array of objects).
        recipe.ingredients.forEach(ingredient => {
          // Extract the ingredient name and amount.
          if (isNaN(ingredient.amount)) {
            console.warn(`Invalid ingredient amount for ingredient "${ingredient.part}". Skipping.`)
            return
          }

          if (!worldRawResources[ingredient.part]) {
            return
          }

          const resource = worldRawResources[ingredient.part]

          // Update the world resource by reducing the available amount.
          worldRawResources[ingredient.part].amount = resource.amount - (ingredient.amount * product.amount)
        })
      })
    })
  }

  // Resets the world's raw resources counts according to the limits provided by the data.
  const generateRawResources = (gameData: DataInterface): { [key: string]: WorldRawResource } => {
    const ores = {} as { [key: string]: WorldRawResource }

    Object.keys(gameData.items.rawResources).forEach(name => {
      const resource = gameData.items.rawResources[name]
      ores[name] = {
        id: name,
        name: resource.name,
        amount: resource.limit,
      }
    })

    // Return a sorted object by the name property. Key is not correct.
    const sortedOres = Object.values(ores).sort((a, b) => a.name.localeCompare(b.name))

    const sortedOresAsObj: {[key: string]: WorldRawResource } = {}
    sortedOres.forEach(ore => {
      sortedOresAsObj[ore.id] = ore
    })

    return sortedOresAsObj
  }

  const findFactory = (factoryId: string | number): Factory | null => {
    return findFac(factoryId, factories.value)
  }

  const updateFactories = (newFactories: Factory[]) => {
    factories.value = newFactories
    forceSort()
    console.log('Factories updated and re-sorted')
  }

  // We update the factory in layers of calculations. This makes it much easier to conceptualize.
  const updateFactory = (factory: Factory) => {
    factory.rawResources = {}
    factory.parts = {}

    const gameData = props.gameData
    if (!gameData) {
      console.error('No game data provided to updateFactory!')
      return
    }

    updateWorldRawResources(gameData)

    // Calculate what is inputted into the factory to be used by products.
    calculateInputs(factory)

    // Calculate what is produced and required by the products.
    calculateProducts(factory, gameData)

    // And calculate Byproducts
    calculateByProducts(factory, gameData)

    // Calculate building requirements for each product based on the selected recipe and product amount.
    calculateBuildingRequirements(factory, gameData)

    // Calculate if we have products satisfied by raw resources.
    calculateRawSupply(factory, gameData)

    // Calculate if we have any internal products that can be used to satisfy requirements.
    calculateInternalProducts(factory, gameData)

    // Then we calculate the satisfaction of the factory.
    calculateFactorySatisfaction(factory)

    // We then calculate the building and power demands to make the factory.
    calculateBuildingsAndPower(factory)

    // Then we calculate the output state of the factory (including surplus etc).
    calculateSurplus(factory)

    // Check all other factories to see if they are affected by this factory change.
    constructDependencies(factories.value)
    factories.value.forEach(factory => {
      calculateDependencyMetrics(factory)
    })

    // Export Calculator stuff
    configureExportCalculator(factories.value)

    // Add a flag to denote if we're only using raw resources to make products.
    calculateUsingRawResourcesOnly(factory, gameData)

    // Go through all factories and check if they have any problems.
    calculateHasProblem(factories.value)
  }

  const deleteFactory = (factory: Factory) => {
    // Find the index of the factory to delete
    const index = factories.value.findIndex(fac => fac.id === factory.id)

    if (index !== -1) {
      removeFactoryDependants(factory, factories.value)

      factories.value.splice(index, 1) // Remove the factory at the found index
      updateWorldRawResources(gameData) // Recalculate the world resources

      // After deleting the factory, loop through all factories and update them as inputs / exports have likely changed.
      factories.value.forEach(fac => updateFactory(fac))

      // Regenerate the sort orders
      regenerateSortOrders()
    } else {
      console.error('Factory not found to delete?!')
    }
  }

  const clearAll = () => {
    factories.value.length = 0
    updateWorldRawResources(gameData)
  }

  const getProduct = (factory: Factory, part: string): FactoryItem | ByProductItem | undefined => {
    const product = factory.products.find(product => product.id === part)
    const byProduct = factory.byProducts.find(product => product.id === part)
    return product ?? byProduct ?? undefined
  }

  const getBuildingDisplayName = (building: string) => {
    const buildingFriendly = new Map<string, string>([
      ['assemblermk1', 'Assembler'],
      ['blender', 'Blender'],
      ['constructormk1', 'Constructor'],
      ['converter', 'Converter'],
      ['foundrymk1', 'Foundry'],
      ['hadroncollider', 'Particle Accelerator'],
      ['manufacturermk1', 'Manufacturer'],
      ['oilrefinery', 'Oil Refinery'],
      ['packager', 'Packager'],
      ['quantumencoder', 'Quantum Encoder'],
      ['smeltermk1', 'Smelter'],
      ['waterExtractor', 'Water Extractor'],
    ])

    return buildingFriendly.get(building) || `UNKNOWN BUILDING: ${building}`
  }

  const showHideAll = (mode: 'show' | 'hide') => {
    factories.value.forEach(factory => factory.hidden = mode === 'hide')
  }

  const toggleHelp = () => {
    helpText.value = !helpText.value
  }

  const navigateToFactory = (factoryId: number | string) => {
    const facId = parseInt(factoryId.toString(), 10)
    const factory = findFac(facId, factories.value)
    if (!factory) {
      console.error(`navigateToFactory: Factory ${factoryId} not found!`)
      return
    }
    // Unhide the factory which makes more sense than the user being scrolled to it than having to open it.
    factory.hidden = false

    // Wait a bit for the factory to unhide fully. Hack but works well.
    setTimeout(() => {
      // Navigate to it
      const factoryElement = document.getElementById(`${factoryId}`)
      if (factoryElement) {
        factoryElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
  }

  const moveFactory = (factory: Factory, direction: string) => {
    const currentOrder = factory.displayOrder
    let targetOrder

    if (direction === 'up' && currentOrder > 0) {
      targetOrder = currentOrder - 1
    } else if (direction === 'down' && currentOrder < factories.value.length - 1) {
      targetOrder = currentOrder + 1
    } else {
      return // Invalid move
    }

    // Find the target factory and swap display orders
    const targetFactory = factories.value.find(fac => fac.displayOrder === targetOrder)
    if (targetFactory) {
      targetFactory.displayOrder = currentOrder
      factory.displayOrder = targetOrder
    }

    regenerateSortOrders()
  }

  const regenerateSortOrders = () => {
    let count = 0

    // Sort now, which may have sorted them weirdly
    factories.value = factories.value.sort((a, b) => a.displayOrder - b.displayOrder)

    // Ensure that the display order is correct
    factories.value.forEach(factory => {
      factory.displayOrder = count
      count++
    })

    // Now re-sort
    factories.value = factories.value.sort((a, b) => a.displayOrder - b.displayOrder)
  }

  const forceSort = () => {
    let count = 0

    // Forcefully regenerate the displayOrder counting upwards.
    factories.value.forEach(factory => {
      factory.displayOrder = count
      count++
    })
  }

  const initializeFactories = () => {
    Object.assign(worldRawResources, generateRawResources(gameData))
    updateWorldRawResources(gameData)
  }

  const isItemRawResource = (item: string): boolean => {
    return !!gameData.items.rawResources[item]
  }

  // Initialize during setup
  initializeFactories()

  provide('factoriesWithSurplus', factoriesWithSurplus)
  provide('findFactory', findFactory)
  provide('updateFactory', updateFactory)
  provide('deleteFactory', deleteFactory)
  provide('getBuildingDisplayName', getBuildingDisplayName)
  provide('navigateToFactory', navigateToFactory)
  provide('moveFactory', moveFactory)
  provide('isItemRawResource', isItemRawResource)
  provide('getProduct', getProduct)

  // Grab from local storage if the user has already dismissed this popup
  // If they have, don't show it again.
  const introShow = ref<boolean>(!localStorage.getItem('dismissed-introduction'))

  const setupDemo = () => {
    console.log('setupDemo')
    closeIntro()
    if (factories.value.length > 0) {
      if (confirm('Showing the demo will clear the current plan. Are you sure you wish to do this?')) {
        console.log('Replacing factories with Demo')
        factories.value = demoFactories
      }
    } else {
      console.log('Adding demo factories')
      factories.value = demoFactories
    }
  }

  const closeIntro = () => {
    console.log('closing intro')
    introShow.value = false
    localStorage.setItem('dismissed-introduction', 'true')
  }

  const showIntro = () => {
    console.log('showing intro')
    introShow.value = true
  }
</script>

<style scoped lang="scss">
.planner-container {
  width: 100%;
  height: calc(100vh - 112px);

  @media screen and (min-width: 2000px) {
    margin-left: 10vw;
    width: 90vw;
  }

  @media screen and (min-width: 2560px) {
    margin-left: calc((100vw - 2050px)/2) !important;
  }

  .two-pane-container {
    height: calc(100vh - 112px);
    margin: 0;
  }

  .sticky-sidebar {
    width: 375px;
    max-width: 375px;
    max-height: 87vh; // For some reason this is not relative to the container
    overflow-y: auto; /* Make it scrollable */
  }

  .main-content {
    width: 100%;
    max-height: calc(100vh - 112px);
    overflow-y: auto;

    @media screen and (min-width: 2000px) {
      padding-right: 10vw !important;
    }

    @media screen and (min-width: 2560px) {
      padding-right: calc(100vw - 1800px - 20vw) !important;
    }
  }
}
</style>
