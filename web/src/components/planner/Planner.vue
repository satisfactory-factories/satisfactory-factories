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
      <v-col class="d-none d-md-flex sticky-sidebar" cols="3">
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
      <v-col class="border-s-md" cols="12" md="9">
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
  } from '@/interfaces/planner/Factory'
  import { DataInterface } from '@/interfaces/DataInterface'
  import Todo from '@/components/planner/Todo.vue'
  import {
    calculateDependencies,
    calculateDependencyMetrics,
    calculateFactoryInputSupply,
    calculateFactoryInternalSupply,
    calculateFactoryRawSupply,
    calculateFactorySatisfaction, calculateHasProblem,
    calculateProductRequirements,
    calculateSurplus,
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
  const validFactoriesForImports = computed(() => {
    return factories.filter(factory => {
      // Loop any records in factory.surplus and check they have amount > 0
      Object.keys(factory.surplus).forEach(part => {
        if (factory.surplus[part].amount > 0) {
          return false
        }
      })
      return true
    })
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
      requirementsSatisfied: true, // Until we do the first calculation nothing is wrong
      dependencies: {},
      rawResources: {},
      surplus: {},
      hidden: false,
      hasProblem: false,
    })
  }

  // Scenario 1 (raw material use):
  // - Products are comprised of raw resources e.g. Iron Ingots.
  // - Iron ingots can be used internally. Raw resources can only be used to make Iron Ingots.
  // - Iron ingots can be used in other factories, or internally by creating e.g. Iron Plates.
  // Scenario 2 (imported product use):
  // - Products are comprised of imported products e.g. Iron Ingots.
  // - Iron Ingots are used internally to produce Iron Plates
  // - Iron Ingots can also be used to produce Iron Rods.
  // - Satisfaction for Iron Ingots must be calculated based on the requirements of Iron Plates and Iron Rods.
  // - Both products can be used internally by e.g. screws (Ingots -> Rods -> Screws) and surplus of which can be exported.
  // Scenario 3 (product not exported):
  // - With the advent of the Dimensional Storage portal, we now have the likely use case of products not being shipped anywhere and being used by a combination of sinking and used by the DDU.
  // - Users need to be able to mark the product as "sunk" in order to ensure there's less waste.
  // - As soon as users mark a product as sunk, they need to be informed this is going to occur.
  // Scenario 4 (product shipped to multiple factories):
  // - A product of a factory (and it's surplus) can be distributed to multiple factories. We need to ensure the user is informed that the demands set upon the factory are not being met and they need to increase production to compensate.
  const updateFactory = (factory: Factory) => {
    updateWorldRawResources()

    // We update the factory in layers of calculations. This makes it much easier to conceptualize.

    // First we calculate what is required to make the products, without any injection of inputs etc.
    calculateProductRequirements(factory, props.gameData)

    // Calculate if we have products satisfied by raw resources
    calculateFactoryRawSupply(factory, props.gameData)

    // Calculate if we have any internal products that can be used to satisfy requirements
    calculateFactoryInternalSupply(factory, props.gameData)

    // Then we calculate the effect that inputs have on the requirements
    calculateFactoryInputSupply(factories, factory, props.gameData)

    // Then we calculate the satisfaction of the factory
    calculateFactorySatisfaction(factory)

    // Then we calculate the output state of the factory (including surplus etc)
    calculateSurplus(factory)

    // Check all other factories to see if they are affected by this factory change.
    calculateDependencies(factories)
    calculateDependencyMetrics(factories)

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

  provide('validFactoriesForImports', validFactoriesForImports)
  provide('findFactory', findFactory)
  provide('updateFactory', updateFactory)
  provide('deleteFactory', deleteFactory)
  provide('getPartDisplayName', getPartDisplayName)

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
</style>
