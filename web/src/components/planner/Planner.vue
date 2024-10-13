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
        @clear-all="clearAll"
        @show-demo="showDemo"
        @show-all="showHideAll('show')"
        @hide-all="showHideAll('hide')"
        @toggle-help-text="toggleHelp()"
        :help-text-shown="helpText"
      />
      <v-divider thickness="2px" color="#ccc"></v-divider>
      <planner-factory-list
        :groups="factories"
        @create-factory="createFactory"
      />
    </v-navigation-drawer>
    <v-row>
      <!-- Sticky Sidebar for Desktop -->
      <v-col class="d-none d-md-flex sticky-sidebar" cols="2">
        <v-container class="pa-0">
          <planner-factory-list
            :groups="factories"
            @create-factory="createFactory"
          />
          <v-divider thickness="2px" color="#ccc"></v-divider>
          <planner-global-actions
            class="pt-4"
            @clear-all="clearAll"
            @show-demo="showDemo"
            @show-all="showHideAll('show')"
            @hide-all="showHideAll('hide')"
            @toggle-help-text="toggleHelp()"
            :help-text-shown="helpText"
          />
          <v-divider thickness="2px" color="#ccc"></v-divider>
          <div>
            Copyright
          </div>
        </v-container>
      </v-col>
      <!-- Main Content Area -->
      <v-col cols="12" md="10" class="border-s-md">
        <v-container>
          <v-btn
            class="d-md-none mb-4"
            color="primary"
            prepend-icon="mdi-menu"
          >
            Toggle Sidebar
          </v-btn>

          <todo></todo>
          <planner-world-resources :worldRawResources="worldRawResources"/>

          <planner-factory
            v-for="(factory, index) in factories"
            :key="factory.id"
            :factory="factory"
            :dependencies="dependencies"
            :gameData="gameData"
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

<script setup lang="ts">
import { ref, computed, watch, reactive, provide, defineProps } from 'vue';

import PlannerGlobalActions from "@/components/planner/PlannerGlobalActions.vue";
import { Factory, FactoryDependency, WorldRawResource } from "@/interfaces/planner/Factory";
import { DataInterface } from "@/interfaces/DataInterface";
import Todo from "@/components/planner/Todo.vue";
import {
  updateFactoryRequirements,
  updateFactorySatisfaction,
  calculateDependencies,
} from '@/utils/factoryManager';

const props = defineProps<{ gameData: DataInterface }>();

const factories = reactive<Factory[]>(JSON.parse(localStorage.getItem('factoryGroups') || '[]') as Factory[]);
const worldRawResources = reactive<{ [key: string]: WorldRawResource }>({});
const dependencies = reactive<FactoryDependency>(JSON.parse(localStorage.getItem('factoryDependencies') || '{}'));
const drawer = ref(false);
const helpText = ref(localStorage.getItem('helpText') === 'true');

// ==== WATCHES
watch(factories, (newValue) => {
  localStorage.setItem('factoryGroups', JSON.stringify(newValue));
}, { deep: true });

watch(dependencies, (newValue) => {
  localStorage.setItem('factoryDependencies', JSON.stringify(newValue));
}, { deep: true });

watch(helpText, (newValue) => {
  localStorage.setItem('helpText', JSON.stringify(newValue));
});

// Computed properties
const validFactoriesForImports = computed(() => {
  return factories.filter((factory) => {
    const factoryOutputs = Object.keys(factory.products);
    if (factoryOutputs.length === 0) {
      return false;
    }

    const factorySurplus = Object.values(factory.surplus);
    if (factorySurplus.every(surplus => surplus === 0)) {
      return false;
    }

    return factoryOutputs.every(output => factory.products[output].id && factory.products[output].amount > 0);
  });
});

// This function calculates the world resources available after each group has consumed Raw Resources.
// This is done here globally as it loops all factories. It is not appropriate to be done on group updates.
const updateWorldRawResources = (): void => {
  // Generate fresh world resources as a baseline for calculation.
  Object.assign(worldRawResources, generateRawResources());

  // Loop through each group's products to calculate usage of raw resources.
  factories.forEach(factory => {
    factory.products.forEach(output => {
      const recipe = props.gameData.recipes.find(r => r.id === output.recipe);
      if (!recipe) {
        console.error(`Recipe with ID ${output.id} not found.`);
        return;
      }

      // Loop through each ingredient in the recipe (array of objects).
      recipe.ingredients.forEach(ingredient => {
        // Extract the ingredient name and amount.
        const [ingredientId, ingredientAmount] = Object.entries(ingredient)[0];

        if (isNaN(ingredientAmount)) {
          console.warn(`Invalid ingredient amount for ingredient ${ingredientId}. Skipping.`);
          return;
        }

        if (!worldRawResources[ingredientId]) {
          return;
        }

        const resource = worldRawResources[ingredientId];

        // Update the world resource by reducing the available amount.
        worldRawResources[ingredientId].amount = resource.amount - (ingredientAmount * output.amount)
      });
    });
  });
}

// Resets the world's raw resources counts according to the limits provided by the data.
const generateRawResources = (): { [key: string]: WorldRawResource } => {
  let ores = {} as { [key: string]: WorldRawResource };

  Object.keys(props.gameData.items.rawResources).forEach((name) => {
    const resource = props.gameData.items.rawResources[name];
    ores[name] = {
      name: resource.name,
      amount: resource.limit,
    }
  });

  return ores;
}

const findFactory = (factoryId: string | number): Factory | null => {
  console.log('findFactory', factoryId);

  if (!factoryId) {
    console.warn('No factoryId provided to findFactory');
    return null
  }

  // Ensure factoryId is parsed to a number to match factories array ids
  const factory = factories.find(fac => fac.id === parseInt(factoryId.toString(), 10));
  if (!factory) {
    throw new Error(`Factory ${factoryId} not found!`);
  }
  return factory;
};

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
  });
}

const deleteFactory = (factory: Factory) => {
  // Find the index of the factory to delete
  const index = factories.findIndex(fac => fac.id === factory.id);

  if (index !== -1) {
    factories.splice(index, 1); // Remove the factory at the found index
    updateWorldRawResources();  // Recalculate the world resources

    // After deleting the factory, update the rest to ensure consistency
    factories.forEach(fac => updateFactory(fac));
  }
};

const updateFactory = (factory: Factory) => {
  updateWorldRawResources();
  updateFactoryRequirements(factory, props.gameData);
  updateFactorySatisfaction(factory);
  dependencies.value = calculateDependencies(factories);
}

const clearAll = () => {
  console.log('clearAll');
  factories.length = 0;
  dependencies.length = 0;
  updateWorldRawResources();
}

const getPartDisplayName = (part: string | number) => {
  return props.gameData.items.rawResources[part]?.name || props.gameData.items.parts[part];
}

const showHideAll = (mode: 'show' | 'hide') => {
  factories.forEach(factory => factory.hidden = mode === 'hide');
}

const toggleHelp = () => {
  helpText.value = !helpText.value;
}

const initializeFactories = () => {
  Object.assign(worldRawResources, generateRawResources());
  updateWorldRawResources();

  if (factories.length === 0) {
    createFactory('My first factory');
  }
};

// Initialize during setup
initializeFactories();

provide('validFactoriesForImports', validFactoriesForImports);
provide('findFactory', findFactory);
provide('updateFactory', updateFactory);
provide('deleteFactory', deleteFactory);
provide('getPartDisplayName', getPartDisplayName);

const showDemo = () => {
  console.log('showDemo');
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
