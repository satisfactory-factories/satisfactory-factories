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
        </v-container>
      </v-col>
    </v-row>
  </v-container>


  <!-- Debugging -->
  <div>
    Groups:
    <pre style="text-align: left">{{ JSON.stringify(factories, null, 2) }}</pre>
    Dependencies:
    <pre style="text-align: left">{{ JSON.stringify(dependencies, null, 2) }}</pre>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, provide, defineProps } from 'vue';

import PlannerGlobalActions from "@/components/planner/PlannerGlobalActions.vue";
import { Factory, FactoryDependency, WorldRawResource } from "@/interfaces/planner/Factory";
import { DataInterface } from "@/interfaces/DataInterface";
import Todo from "@/components/planner/Todo.vue";

const props = defineProps<{ gameData: DataInterface }>();

const factories = reactive<Factory[]>(JSON.parse(localStorage.getItem('factoryGroups') || '[]') as Factory[]);
const worldRawResources = reactive<{ [key: string]: WorldRawResource }>({});
const dependencies = ref<FactoryDependency[]>(JSON.parse(localStorage.getItem('factoryDependencies') || '[]'));
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

// Resets the world's raw resources counts according to the limits provided by the data.
function generateRawResources(): { [key: string]: WorldRawResource } {
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

const updateFactoryRequirements = (factory: Factory) => {
  factory.partsRequired = {};
  factory.rawResources = {};
  factory.surplus = {};

  // First loop through each product and add it to internal requirements and surplus.
  factory.products.forEach(product => {
    const recipe = props.gameData.recipes.find(r => r.id === product.recipe);
    if (!recipe) {
      console.error(`Recipe with ID ${product.recipe} not found.`);
      return;
    }

    // Calculate the ingredients needed to make this product.
    recipe.ingredients.forEach(ingredientPart => {
      const [part, partAmount] = Object.entries(ingredientPart)[0];
      if (isNaN(partAmount)) {
        console.warn(`Invalid ingredient amount for ingredient ${part}. Skipping.`);
        return;
      }

      // If it's a raw resource, mark it as fully supplied and don't mark it as a part required.
      const isRaw = !!props.gameData.items.rawResources[part];
      if (isRaw) {
        if (!factory.rawResources[part]) {
          factory.rawResources[part] = {
            name: props.gameData.items.rawResources[part].name,
            amount: 0,
          };
        }
        factory.rawResources[part].amount = partAmount * product.amount;
        factory.rawResources[part].satisfied = true;
      } else {
        if (!factory.partsRequired[part]) {
          factory.partsRequired[part] = {
            amountNeeded: 0,
            amountSupplied: 0,
            satisfied: true, // So we don't get a big red bot as soon as we add a product.
          };
        }

        factory.partsRequired[part].amountNeeded += partAmount * product.amount;

        // Check satisfaction
        if (!factory.partsRequired[part].amountSupplied <= factory.partsRequired[part].amountNeeded) {
          factory.partsRequired[part].satisfied = false;
        }
      }
    });

    // Any remaining product that is not used internally is surplus.
    if (!factory.surplus[product.id]) {
      factory.surplus[product.id] = 0;

      // If the handling isn't already set (so we don't blow it away again)
      if (!factory.surplusHandling[product.id]) {
        factory.surplusHandling[product.id] = 'export'; // Assume user will export it by default
      }
    }

    // If the user has chosen to sink the resources, we don't need to calculate the surplus and zero it out
    if (factory.surplusHandling[product.id] === 'sink') {
      factory.surplus[product.id] = 0;
    } else {
      factory.surplus[product.id] += product.amount;
    }
  });

  // Satisfy internal requirements with existing group products (like screws from iron rods).
  Object.keys(factory.partsRequired).forEach(part => {
    // If it's raw, don't bother
    if (!factory.partsRequired[part]) {
      return;
    }

    const requirement = factory.partsRequired[part];

    factory.products.forEach(product => {
      if (product.id === part) {
        const usedAmount = Math.min(product.amount, requirement.amountNeeded - requirement.amountSupplied);
        requirement.amountSupplied += usedAmount;

        // Reduce surplus amount accordingly.
        if (factory.surplus[product.id]) {
          factory.surplus[product.id] = Math.max(0, factory.surplus[product.id] - usedAmount);
        }

        requirement.satisfied = requirement.amountSupplied >= requirement.amountNeeded;
      }
    });
  });
}

const updateFactorySatisfaction = (factory: Factory) => {
  // Calculate based on the inputs of the group if the requirements are satisfied.
  Object.keys(factory.inputs).forEach(input => {
    const part = factory.inputs[input].outputPart;
    const requirement = factory.partsRequired[part];

    if (!requirement) {
      console.error(`Part ${part} not found in requirements.`);
      return;
    }

    // How get the amount of supply provided by the input
    requirement.amountSupplied += factory.inputs[input].amount

    // Check if the input amount is enough to satisfy the requirement.
    const satisfied = requirement.amountSupplied >= requirement.amountNeeded;

    if (satisfied) {
      requirement.satisfied = true;
    }

    // If the part has 0 requirements it is technically satisfied
    if (requirement.amountNeeded == 0) {
      requirement.satisfied = true;
    }
  });

  // Now check if all requirements are satisfied.
  factory.inputsSatisfied = Object.keys(factory.partsRequired).every(part => factory.partsRequired[part].satisfied);
}

const calculateDependencies = (): FactoryDependency => {
  const newDependencies: FactoryDependency = {};

  // Iterate through factories to build the initial dependencies with requests
  factories.forEach(factory => {
    factory.inputs.forEach(input => {
      // Check if the input is actually still valid, if the user has set an resource to sink this is no longer valid.
      // We do this by checking the requested group to see if the surplus is still there.
      const requestedGroup = factories.find(g => g.id === input.groupId);

      // We need to pick up on the following conditions:
      // 1. The group is no longer valid (e.g. the user has set it to sink)
      // 2. The group is valid but the product is no longer available, BUT not if it's undefined e.g. "" because the UI is still being edited.
      if (!requestedGroup || !requestedGroup.surplus[input.outputPart] && input.outputPart !== "") {
        console.warn('Input is no longer valid, removing it.', input);
        // Remove the input from the group
        factory.inputs = factory.inputs.filter(i => i !== input);

        // Run the requirements check again just for this affected group
        updateFactory(factory);
        return;
      }

      const request = {
        part: input.outputPart,
        amount: input.amount,
      };

      // Create an entry for the group that is being requested from if it doesn't exist
      if (!newDependencies[input.groupId]) {
        newDependencies[input.groupId] = {
          requestedBy: {},
          metrics: {},
        };
      }

      // Create requests array for the specific group relationship if it doesn't exist
      if (!newDependencies[input.groupId].requestedBy[factory.id]) {
        newDependencies[input.groupId].requestedBy[factory.id] = [];
      }

      // Add the requests to the appropriate group
      newDependencies[input.groupId].requestedBy[factory.id].push(request);
    });
  });

  // Now loop through the dependencies and calculate the total requests upon each part within the group
  Object.keys(newDependencies).forEach(groupDepId => {
    const groupDependency = newDependencies[groupDepId];

    Object.keys(groupDependency.requestedBy).forEach(depGroupId => {
      const depGroup = groupDependency.requestedBy[depGroupId];
      depGroup.forEach(request => {
        const part = request.part;

        if (!groupDependency.metrics[part]) {
          groupDependency.metrics[part] = {
            part,
            request: 0,
            supply: 0,
            isRequestSatisfied: false,
          };
        }

        groupDependency.metrics[part].request += request.amount;
      });
    });

    // Calculate the supply and whether the request is satisfied
    const thisGroup = factories.find(group => group.id === parseInt(groupDepId));

    Object.keys(thisGroup.surplus).forEach(product => {
      const amount = thisGroup.surplus[product]; // Get the amount of the product from the surplus object

      if (groupDependency.metrics[product]) {
        groupDependency.metrics[product].supply = amount;
        groupDependency.metrics[product].isRequestSatisfied = amount >= groupDependency.metrics[product].request;
      }
    });
  });

  // Replace the existing dependencies with the new ones
  return newDependencies;
}

const updateFactory = (factory: Factory) => {
  updateWorldRawResources();
  updateFactoryRequirements(factory);
  updateFactorySatisfaction(factory);
  dependencies.value = calculateDependencies();
}

const findFactory = (groupId: string | number): Factory => {
  const factory = factories.find(group => group.id === parseInt(groupId));
  if (!factory) {
    throw new Error(`Group ${groupId} not found!`);
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

const clearAll = () => {
  console.log('clearAll');
  factories.length = 0;
  dependencies.value.length = 0;
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
