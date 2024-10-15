<template>
  <v-container max-width="100%">
    <!-- The Drawer for Mobile -->
    <v-navigation-drawer
      v-model="drawer"
      app
      class="d-md-none"
      temporary
    >
      <planner-global-actions
        class="py-4"
        :help-text-shown="helpText"
        @clear-all="clearAll"
        @hide-all="showHideAll('hide')"
        @show-all="showHideAll('show')"
        @show-demo="showDemo"
        @toggle-help-text="toggleHelp()"
      />
      <v-divider color="#ccc" thickness="2px" />
      <planner-factory-list
        :factories="factories"
        @create-factory="createFactory"
      />
    </v-navigation-drawer>
    <v-row>
      <!-- Sticky Sidebar for Desktop -->
      <v-col class="d-none d-md-flex sticky-sidebar" style="max-width: 350px">
        <v-container class="pa-0">
          <planner-factory-list
            :factories="factories"
            @create-factory="createFactory"
          />
          <v-divider color="#ccc" thickness="2px" />
          <planner-global-actions
            class="py-2"
            :help-text-shown="helpText"
            @clear-all="clearAll"
            @hide-all="showHideAll('hide')"
            @show-all="showHideAll('show')"
            @show-demo="showDemo"
            @toggle-help-text="toggleHelp()"
          />
          <v-divider color="#ccc" thickness="2px" />
          <div>
            Copyright
          </div>
        </v-container>
      </v-col>
      <!-- Main Content Area -->
      <v-col class="border-s-md pa-0" style="max-width: 1200px">
        <v-container>
          <v-btn
            class="d-md-none mb-4"
            color="primary"
            prepend-icon="mdi-menu"
          >
            Toggle Sidebar
          </v-btn>

          <todo />
          <planner-world-resources :world-raw-resources="worldRawResources" />

          <planner-factory
            v-for="(factory) in factories"
            :key="factory.id"
            :factory="factory"
            :game-data="gameData"
            :help-text="helpText"
          />

          <!-- Debugging -->
          <div class="mt-16">
            <h4 class="text-h5">DEBUG</h4>
            <pre style="text-align: left">{{ JSON.stringify(factories, null, 2) }}</pre>
          </div>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, defineProps, provide, reactive, ref, watch } from 'vue'

  import PlannerGlobalActions from '@/components/planner/PlannerGlobalActions.vue'
  import {
    Factory,
    WorldRawResource,
  } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'
  import Todo from '@/components/planner/Todo.vue'
  import {
    calculateBuildingRequirements,
    calculateDependencies,
    calculateDependencyMetrics, calculateFactoryBuildingsAndPower,
    calculateFactoryInputSupply,
    calculateFactoryInternalSupply,
    calculateFactoryRawSupply,
    calculateFactorySatisfaction, calculateHasProblem,
    calculateProductRequirements,
    calculateSurplus, calculateUsingRawResourcesOnly,
  } from '@/utils/factoryManager'

  const props = defineProps<{ gameData: DataInterface }>()

  const factories = reactive<Factory[]>(JSON.parse(localStorage.getItem('factoryGroups') || '[]') as Factory[])
  const worldRawResources = reactive<{ [key: string]: WorldRawResource }>({})
  const drawer = ref(false)
  const helpText = ref(localStorage.getItem('helpText') === 'true')

  // ==== WATCHES
  watch(factories, newValue => {
    localStorage.setItem('factoryGroups', JSON.stringify(newValue))
  }, { deep: true })

  watch(helpText, newValue => {
    localStorage.setItem('helpText', JSON.stringify(newValue))
  })

  // Computed properties
  const factoriesWithSurplus = computed(() => {
    // Loop through all factories and see if any have any surplus
    return factories.filter(factory => Object.keys(factory.surplus).length > 0)
  })

  // This function calculates the world resources available after each group has consumed Raw Resources.
  // This is done here globally as it loops all factories. It is not appropriate to be done on group updates.
  const updateWorldRawResources = (): void => {
    // Generate fresh world resources as a baseline for calculation.
    Object.assign(worldRawResources, generateRawResources())

    // Loop through each group's products to calculate usage of raw resources.
    factories.forEach(factory => {
      factory.products.forEach(product => {
        const recipe = props.gameData.recipes.find(r => r.id === product.recipe)
        if (!recipe) {
          console.error(`Recipe with ID ${product.id} not found.`)
          return
        }

        // Loop through each ingredient in the recipe (array of objects).
        recipe.ingredients.forEach(ingredient => {
          // Extract the ingredient name and amount.
          const [ingredientId, ingredientAmount] = Object.entries(ingredient)[0]

          if (isNaN(ingredientAmount)) {
            console.warn(`Invalid ingredient amount for ingredient ${ingredientId}. Skipping.`)
            return
          }

          if (!worldRawResources[ingredientId]) {
            return
          }

          const resource = worldRawResources[ingredientId]

          // Update the world resource by reducing the available amount.
          worldRawResources[ingredientId].amount = resource.amount - (ingredientAmount * product.amount)
        })
      })
    })
  }

  // Resets the world's raw resources counts according to the limits provided by the data.
  const generateRawResources = (): { [key: string]: WorldRawResource } => {
    const ores = {} as { [key: string]: WorldRawResource }

    Object.keys(props.gameData.items.rawResources).forEach(name => {
      const resource = props.gameData.items.rawResources[name]
      ores[name] = {
        name: resource.name,
        amount: resource.limit,
      }
    })

    return ores
  }

  const findFactory = (factoryId: string | number): Factory | null => {
    if (!factoryId) {
      console.warn('No factoryId provided to findFactory')
      return null
    }

    // Ensure factoryId is parsed to a number to match factories array ids
    const factory = factories.find(fac => fac.id === parseInt(factoryId.toString(), 10))
    if (!factory) {
      throw new Error(`Factory ${factoryId} not found!`)
    }
    return factory
  }

  const createFactory = (name = 'A new factory') => {
    factories.push({
      id: Math.floor(Math.random() * 10000),
      name,
      products: [],
      internalProducts: {},
      inputs: [],
      partRequirements: {},
      buildingRequirements: {},
      requirementsSatisfied: true, // Until we do the first calculation nothing is wrong
      totalPower: 0,
      dependencies: {},
      rawResources: {},
      usingRawResourcesOnly: false,
      surplus: {},
      hidden: false,
      hasProblem: false,
    })
  }

  // We update the factory in layers of calculations. This makes it much easier to conceptualize.
  const updateFactory = (factory: Factory) => {
    updateWorldRawResources()

    // First we calculate what is required to make the products, without any injection of inputs etc.
    calculateProductRequirements(factory, props.gameData)

    // Calculate building requirements for each product based on the selected recipe and product amount.
    calculateBuildingRequirements(factory, props.gameData)

    // Calculate if we have products satisfied by raw resources.
    calculateFactoryRawSupply(factory, props.gameData)

    // Calculate if we have any internal products that can be used to satisfy requirements.
    calculateFactoryInternalSupply(factory, props.gameData)

    // Then we calculate the effect that inputs have on the requirements.
    calculateFactoryInputSupply(factories, factory, props.gameData)

    // Then we calculate the satisfaction of the factory.
    calculateFactorySatisfaction(factory)

    // We then calculate the building and power demands to make the factory.
    calculateFactoryBuildingsAndPower(factory)

    // Then we calculate the output state of the factory (including surplus etc).
    calculateSurplus(factory)

    // Check all other factories to see if they are affected by this factory change.
    calculateDependencies(factories)
    calculateDependencyMetrics(factories)

    // Add a flag to denote if we're only using raw resources to make products.
    calculateUsingRawResourcesOnly(factory)

    // Finally, set the flags for if the factory has any issues for display.
    calculateHasProblem(factory)
  }

  const deleteFactory = (factory: Factory) => {
    // Find the index of the factory to delete
    const index = factories.findIndex(fac => fac.id === factory.id)

    if (index !== -1) {
      factories.splice(index, 1) // Remove the factory at the found index
      updateWorldRawResources() // Recalculate the world resources

      // After deleting the factory, update the rest to ensure consistency
      factories.forEach(fac => updateFactory(fac))
    }
  }

  const clearAll = () => {
    factories.length = 0
    updateWorldRawResources()
  }

  const getPartDisplayName = (part: string | number) => {
    return props.gameData.items.rawResources[part]?.name || props.gameData.items.parts[part]
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
    factories.forEach(factory => factory.hidden = mode === 'hide')
  }

  const toggleHelp = () => {
    helpText.value = !helpText.value
  }

  const initializeFactories = () => {
    Object.assign(worldRawResources, generateRawResources())
    updateWorldRawResources()

    if (factories.length === 0) {
      createFactory('My first factory')
    }
  }

  // Initialize during setup
  initializeFactories()

  provide('factoriesWithSurplus', factoriesWithSurplus)
  provide('findFactory', findFactory)
  provide('updateFactory', updateFactory)
  provide('deleteFactory', deleteFactory)
  provide('getPartDisplayName', getPartDisplayName)
  provide('getBuildingDisplayName', getBuildingDisplayName)

  const showDemo = () => {
    console.log('showDemo')
  }
</script>

<style lang="scss" scoped>
.sticky-sidebar {
  position: sticky;
  width: 100%;
  top: 0;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}
</style>

<style lang="scss">
.selectors {
  &:last-of-type {
    margin-bottom: 12px !important;
  }

  .v-input__prepend {
    margin-right: 10px;
  }
}

.v-list-item__prepend {
  padding-right: 10px;
}

.last-child-no-margin {
  :last-child {
    margin-bottom: 0 !important;
  }
}

.my-card {
  background-color: rgb(50, 50, 50);

  &:last-of-type {
    border-bottom: 0;
    box-shadow: 0 0 0 0;
  }
}

.v-card-title {
  padding: 1rem;

}
</style>
