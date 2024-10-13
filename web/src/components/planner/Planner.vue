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
        class="pt-4"
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
      <v-col class="d-none d-md-flex sticky-sidebar" cols="2">
        <v-container class="pa-0">
          <planner-factory-list
            :factories="factories"
            @create-factory="createFactory"
          />
          <v-divider color="#ccc" thickness="2px" />
          <planner-global-actions
            class="pt-4"
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
      <v-col class="border-s-md" cols="12" md="10">
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
            :dependencies="dependencies"
            :factory="factory"
            :game-data="gameData"
            :help-text="helpText"
          />

          <!-- Debugging -->
          <div class="mt-16">
            <h4 class="text-h5">DEBUG</h4>
            Factories:
            <pre style="text-align: left">{{ JSON.stringify(factories, null, 2) }}</pre>
            Dependencies:
            <pre style="text-align: left">{{ JSON.stringify(dependencies, null, 2) }}</pre>
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
    FactoryDependency,
    FactoryDependencyMetrics,
    FactoryDependencyRequest,
    WorldRawResource,
  } from '@/interfaces/planner/Factory'
  import { DataInterface } from '@/interfaces/DataInterface'
  import Todo from '@/components/planner/Todo.vue'
  import {
    calculateDependencies,
    updateFactoryRequirements,
    updateFactorySatisfaction,
  } from '@/utils/factoryManager'

  const props = defineProps<{ gameData: DataInterface }>()

  const factories = reactive<Factory[]>(JSON.parse(localStorage.getItem('factoryGroups') || '[]') as Factory[])
  const worldRawResources = reactive<{ [key: string]: WorldRawResource }>({})
  const dependencies = reactive<FactoryDependency>(JSON.parse(localStorage.getItem('factoryDependencies') || '{}'))
  const drawer = ref(false)
  const helpText = ref(localStorage.getItem('helpText') === 'true')

  // ==== WATCHES
  watch(factories, newValue => {
    localStorage.setItem('factoryGroups', JSON.stringify(newValue))
  }, { deep: true })

  watch(dependencies, newValue => {
    localStorage.setItem('factoryDependencies', JSON.stringify(newValue))
  }, { deep: true })

  watch(helpText, newValue => {
    localStorage.setItem('helpText', JSON.stringify(newValue))
  })

  // Computed properties
  const validFactoriesForImports = computed(() => {
    return factories.filter(factory => {
      const factoryOutputs = Object.keys(factory.products)
      if (factoryOutputs.length === 0) {
        return false
      }

      const factorySurplus = Object.values(factory.surplus)
      if (factorySurplus.every(surplus => surplus === 0)) {
        return false
      }

      return factoryOutputs.every(output => factory.products[output].id && factory.products[output].amount > 0)
    })
  })

  // This function calculates the world resources available after each group has consumed Raw Resources.
  // This is done here globally as it loops all factories. It is not appropriate to be done on group updates.
  const updateWorldRawResources = (): void => {
    // Generate fresh world resources as a baseline for calculation.
    Object.assign(worldRawResources, generateRawResources())

    // Loop through each group's products to calculate usage of raw resources.
    factories.forEach(factory => {
      factory.products.forEach(output => {
        const recipe = props.gameData.recipes.find(r => r.id === output.recipe)
        if (!recipe) {
          console.error(`Recipe with ID ${output.id} not found.`)
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
          worldRawResources[ingredientId].amount = resource.amount - (ingredientAmount * output.amount)
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
    console.log('findFactory', factoryId)

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
      inputs: [],
      partsRequired: {},
      inputsSatisfied: true,
      rawResources: {},
      surplus: {},
      surplusHandling: {},
      hidden: false,
    })
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

  const updateFactory = (factory: Factory) => {
    updateWorldRawResources()
    updateFactoryRequirements(factory, props.gameData)
    updateFactorySatisfaction(factory)
    dependencies.value = calculateDependencies(factories)
  }

  const clearAll = () => {
    console.log('clearAll')
    factories.length = 0
    dependencies.length = 0
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

  const getRequestsForFactoryByProduct = (factory: Factory | string, part: string): FactoryDependencyRequest[] => {
    // If sent an empty factory, there's no request.
    if (!factory) {
      return []
    }
    // Return an object containing the requests of all factories requesting a particular part
    // We need to get all requests set upon by other factories and check their part names
    // If the part name matches the one we're looking for, we add it to the list.
    const factoryIdStr = factory.id.toString() // JavaScript doing bullshit things
    const factoryRequests = dependencies[factoryIdStr]?.requestedBy

    if (!factoryRequests) {
      return []
    }

    // Create a new object returning the requests for the specific part, injecting the factory ID.
    // They can only ever request one part from us, so return it as a flat array.
    return Object.entries(factoryRequests).map(([factoryId, requests]) => {
      return requests.filter(request => request.part === part).map(request => {
        return {
          ...request,
          factory: factoryId,
        }
      })
    }).flat()
  }

  const getRequestMetricsForFactoryByPart = (factory: Factory, part: string): FactoryDependencyMetrics => {
    // Requests may be empty.
    if (!factory || !part || !factory.id) {
      return {}
    }

    // Dependency may be empty.
    if (!dependencies[factory.id.toString()]) {
      return {}
    }
    return dependencies[factory.id.toString()].metrics[part] ?? {}
  }

  // Initialize during setup
  initializeFactories()

  provide('validFactoriesForImports', validFactoriesForImports)
  provide('findFactory', findFactory)
  provide('updateFactory', updateFactory)
  provide('deleteFactory', deleteFactory)
  provide('getPartDisplayName', getPartDisplayName)
  provide('getRequestsForFactoryByProduct', getRequestsForFactoryByProduct)
  provide('getRequestMetricsForFactoryByPart', getRequestMetricsForFactoryByPart)

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
</style>
