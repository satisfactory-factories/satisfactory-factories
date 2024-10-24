<template>
  <v-container class="planner-container">
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
        @show-demo="showDemo"
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
            @show-demo="showDemo"
            @toggle-help-text="toggleHelp()"
          />
        </v-container>
      </v-col>
      <!-- Main Content Area -->
      <v-col class="border-s-md pa-0 main-content">
        <v-container>
          <v-btn
            class="d-md-none mb-4"
            color="primary"
            prepend-icon="mdi-menu"
          >
            Toggle Sidebar
          </v-btn>

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
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, defineProps, provide, reactive, ref, watch } from 'vue'

  import PlannerGlobalActions from '@/components/planner/PlannerGlobalActions.vue'
  import { Factory, WorldRawResource } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'
  import Todo from '@/components/planner/Todo.vue'
  import {
    calculateBuildingRequirements,
    calculateBuildingsAndPower,
    calculateByProducts,
    calculateDependencies,
    calculateDependencyMetrics,
    calculateFactorySatisfaction,
    calculateHasProblem,
    calculateInputs,
    calculateInternalProducts,
    calculateProducts,
    calculateRawSupply,
    calculateSurplus,
    calculateUsingRawResourcesOnly,
    configureExportCalculator,
  } from '@/utils/factoryManager'
  import { useAppStore } from '@/stores/app-store'
  import { storeToRefs } from 'pinia'

  const props = defineProps<{ gameData: DataInterface }>()

  const appStore = useAppStore()
  const { factories } = storeToRefs(appStore)

  const worldRawResources = reactive<{ [key: string]: WorldRawResource }>({})
  const drawer = ref(false)
  const helpText = ref(localStorage.getItem('helpText') === 'true')

  // ==== WATCHES
  watch(helpText, newValue => {
    localStorage.setItem('helpText', JSON.stringify(newValue))
  })

  // Computed properties
  const factoriesWithSurplus = computed(() => {
    // Loop through all factories and see if any have any surplus
    return factories.value.filter(factory => Object.keys(factory.surplus).length > 0)
  })

  // This function calculates the world resources available after each group has consumed Raw Resources.
  // This is done here globally as it loops all factories.value. It is not appropriate to be done on group updates.
  const updateWorldRawResources = (): void => {
    // Generate fresh world resources as a baseline for calculation.
    Object.assign(worldRawResources, generateRawResources())

    // Loop through each group's products to calculate usage of raw resources.
    factories.value.forEach(factory => {
      factory.products.forEach(product => {
        const recipe = props.gameData.recipes.find(r => r.id === product.recipe)
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
  const generateRawResources = (): { [key: string]: WorldRawResource } => {
    const ores = {} as { [key: string]: WorldRawResource }

    Object.keys(props.gameData.items.rawResources).forEach(name => {
      const resource = props.gameData.items.rawResources[name]
      ores[name] = {
        id: name,
        name: resource.name,
        amount: resource.limit,
      }
    })

    // Return a sorted object by the name property. Key is not correct.
    const sortedOres = Object.values(ores).sort((a, b) => a.name.localeCompare(b.name))

    const sortedOresAsObj = {}
    sortedOres.forEach(ore => {
      sortedOresAsObj[ore.id] = ore
    })

    return sortedOresAsObj
  }

  const findFactory = (factoryId: string | number): Factory | null => {
    if (!factoryId) {
      console.warn('No factoryId provided to findFactory')
      return null
    }

    // Ensure factoryId is parsed to a number to match factories array ids
    const factory = factories.value.find(fac => fac.id === parseInt(factoryId.toString(), 10))
    if (!factory) {
      throw new Error(`Factory ${factoryId} not found!`)
    }
    return factory
  }

  const createFactory = (name = 'A new factory') => {
    const factory: Factory = {
      id: Math.floor(Math.random() * 10000),
      name,
      products: [],
      internalProducts: {},
      inputs: [],
      parts: {},
      buildingRequirements: {},
      requirementsSatisfied: true, // Until we do the first calculation nothing is wrong
      totalPower: 0,
      dependencies: {},
      exportCalculator: {},
      rawResources: {},
      usingRawResourcesOnly: false,
      surplus: {},
      hidden: false,
      hasProblem: false,
      displayOrder: factories.value.length,
    }
    factories.value.push(factory)

    navigateToFactory(factory.id)
  }

  const updateFactories = (newFactories: Factory[]) => {
    console.log('updateFactories', newFactories[0])
    factories.value = newFactories
    forceSort()
    console.log('Factories updated and re-sorted')
  }

  // We update the factory in layers of calculations. This makes it much easier to conceptualize.
  const updateFactory = (factory: Factory) => {
    factory.rawResources = {}
    factory.parts = {}

    updateWorldRawResources()

    // Calculate what is inputted into the factory to be used by products.
    calculateInputs(factory)

    // Calculate what is produced and required by the products.
    calculateProducts(factory, props.gameData)

    // And calculate Byproducts
    calculateByProducts(factory, props.gameData)

    // Calculate building requirements for each product based on the selected recipe and product amount.
    calculateBuildingRequirements(factory, props.gameData)

    // Calculate if we have products satisfied by raw resources.
    calculateRawSupply(factory, props.gameData)

    // Calculate if we have any internal products that can be used to satisfy requirements.
    calculateInternalProducts(factory, props.gameData)

    // Then we calculate the satisfaction of the factory.
    calculateFactorySatisfaction(factory)

    // We then calculate the building and power demands to make the factory.
    calculateBuildingsAndPower(factory)

    // Then we calculate the output state of the factory (including surplus etc).
    calculateSurplus(factory)

    // Check all other factories to see if they are affected by this factory change.
    calculateDependencies(factories.value)
    calculateDependencyMetrics(factories.value)

    // Export Calculator stuff
    configureExportCalculator(factories.value)

    // Add a flag to denote if we're only using raw resources to make products.
    calculateUsingRawResourcesOnly(factory, props.gameData)

    // Go through all factories and check if they have any problems.
    calculateHasProblem(factories.value)
  }

  const deleteFactory = (factory: Factory) => {
    // Find the index of the factory to delete
    const index = factories.value.findIndex(fac => fac.id === factory.id)

    if (index !== -1) {
      // Remove the inputs from factories that depend on this factory
      if (factory.dependencies?.requests) {
        const dependents = factory.dependencies?.requests

        Object.keys(dependents).forEach(dependentId => {
          const dependent = findFactory(dependentId)
          dependent.inputs = dependent.inputs.filter(input => input.factory !== factory.id)
        })
      }

      factories.value.splice(index, 1) // Remove the factory at the found index
      updateWorldRawResources() // Recalculate the world resources

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
    updateWorldRawResources()
  }

  const getPartDisplayName = (part: string | number) => {
    return props.gameData.items.rawResources[part]?.name || props.gameData.items.parts[part]?.name
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

  const navigateToFactory = (factoryId: string) => {
    // Unhide the factory
    const factory = findFactory(factoryId)
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
    Object.assign(worldRawResources, generateRawResources())
    updateWorldRawResources()
  }

  const sluggify = (subject: string): string => {
    // Converts CamelCase to kebab-case without adding dash at the beginning
    return subject.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase()
  }

  const getIcon = (
    subject: string,
    type: 'building' | 'item',
    size: 'small' | 'big' = 'small'
  ): string => {
    if (!subject) {
      console.error('No subject provided to getIcon!')
      return ''
    }
    if (type === 'building') {
      return getImageUrl(subject, 'building', size)
    } else {
      const partItem = props.gameData.items.parts[subject]
      const rawItem = props.gameData.items.rawResources[subject]
      const item = partItem?.name || rawItem?.name || subject

      return getImageUrl(sluggify(item), 'item', size)
    }
  }

  const getImageUrl = (
    name: string,
    type: 'building' | 'item',
    size: 'small' | 'big' = 'big'
  ): string => {
    const pxSize = size === 'small' ? '64' : '256'
    return `/assets/game/images/${type}/${name}_${pxSize}.png`
  }

  const isItemRawResource = (item: string): boolean => {
    return !!props.gameData.items.rawResources[item]
  }

  // Initialize during setup
  initializeFactories()

  provide('factoriesWithSurplus', factoriesWithSurplus)
  provide('findFactory', findFactory)
  provide('updateFactory', updateFactory)
  provide('deleteFactory', deleteFactory)
  provide('getPartDisplayName', getPartDisplayName)
  provide('getBuildingDisplayName', getBuildingDisplayName)
  provide('navigateToFactory', navigateToFactory)
  provide('moveFactory', moveFactory)
  provide('getIcon', getIcon)
  provide('isItemRawResource', isItemRawResource)

  const showDemo = () => {
    console.log('showDemo')
  }
</script>

<style lang="scss">
.planner-container {
  max-width: 100%;
  height: calc(100vh - 112px);
  padding: 0;
  overflow-y: hidden;

  .two-pane-container {
    height: calc(100vh - 112px);
    margin: 0;
  }

  .sticky-sidebar {
    width: 350px;
    max-width: 350px;
    max-height: 87vh; // For some reason this is not relative to the container
    overflow-y: auto; /* Make it scrollable */
  }

  .main-content {
    max-height: calc(100vh - 112px);
    overflow-y: auto;
  }
}

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

.sub-card {
  background-color: rgb(50, 50, 50);

  &:last-of-type {
    border-bottom: 0;
    box-shadow: 0 0 0 0;
  }
}

.no-bottom {
  &:last-of-type {
    border-bottom: 0 !important;
    margin-bottom: 0 !important;
    box-shadow: 0 0 0 0;
  }
}

.factory-card {
  transition: all 0.3s;
  border: 2px solid rgb(108, 108, 108);

  .header {
    padding: 16px 16px 0 !important;
    margin-bottom: 0;
    border-bottom: 1px solid rgb(108, 108, 108);
    align-items: center;
    transition: background-color 0.3s;
    background-color: rgba(43, 43, 43, 0.4);

    &.list {
      padding: 0 !important;
      border-bottom: 0;
    }
  }

  &.problem {
    border: 2px solid #dc3545;

    .header {
      background-color: rgba(140, 9, 21, 0.4);
    }
  }
}

.v-card-title {
  padding: 1rem;
}

.fa-bolt {
  font-size: 20px;
}

.border-gray {
  border-color: rgb(129, 129, 129) !important;
}
.border-light-gray {
  border-color: rgb(186, 186, 186) !important;
}
</style>
