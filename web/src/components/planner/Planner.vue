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
        @toggle-help-text="toggleHelp"
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
            @toggle-help-text="toggleHelp"
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
            @click="toggleDrawer"
          >
            Toggle Sidebar
          </v-btn>

          <todo></todo>
          <planner-world-resources :worldRawResources="worldRawResources" />

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
import { computed, defineProps, defineEmits, reactive, ref, watch, provide } from 'vue';
import PlannerGlobalActions from "@/components/planner/PlannerGlobalActions.vue";
import Todo from "@/components/planner/Todo.vue";
import { Factory, FactoryDependency, WorldRawResource } from "@/interfaces/planner/Factory";
import { DataInterface } from "@/interfaces/DataInterface";

// Props
const props = defineProps<{ gameData: DataInterface }>();

// Reactive variables
const factories = reactive<Factory[]>(JSON.parse(localStorage.getItem('factoryGroups') || '[]'));
const worldRawResources = reactive<{ [key: string]: WorldRawResource }>({});
const dependencies = ref<FactoryDependency[]>(JSON.parse(localStorage.getItem('factoryDependencies') || '[]'));
const drawer = ref(false);
const helpText = ref(localStorage.getItem('helpText') === 'true');

// Emits
const emit = defineEmits<{
  'show-demo': () => void;
  'hide-all': () => void;
  'show-all': () => void;
  'toggle-help-text': () => void;
  'clear-all': () => void;
}>();

// Computed properties
const validFactoriesForImports = computed(() => {
  return factories.filter((group) => {
    const groupOutputs = Object.keys(group.products);
    if (groupOutputs.length === 0) {
      return false;
    }

    const groupSurplus = Object.values(group.surplus);
    if (groupSurplus.every((surplus) => surplus === 0)) {
      return false;
    }

    return groupOutputs.every(
      (output) => group.products[output].id && group.products[output].amount > 0
    );
  });
});

// Watches
watch(
  factories,
  (newValue) => {
    localStorage.setItem('factoryGroups', JSON.stringify(newValue));
  },
  { deep: true }
);

watch(
  dependencies,
  (newValue) => {
    localStorage.setItem('factoryDependencies', JSON.stringify(newValue));
  },
  { deep: true }
);

watch(helpText, (newValue) => {
  localStorage.setItem('helpText', JSON.stringify(newValue));
});

// Methods
const toggleDrawer = () => {
  drawer.value = !drawer.value;
};

const generateRawResources = (): { [key: string]: WorldRawResource } => {
  const ores: { [key: string]: WorldRawResource } = {};
  Object.keys(props.gameData.items.rawResources).forEach((name) => {
    const resource = props.gameData.items.rawResources[name];
    ores[name] = {
      name: resource.name,
      amount: resource.limit,
    };
  });
  return ores;
};

const updateWorldRawResources = (): void => {
  Object.assign(worldRawResources, generateRawResources());
  factories.forEach((factory) => {
    factory.products.forEach((output) => {
      const recipe = props.gameData.recipes.find((r) => r.id === output.recipe);
      if (!recipe) {
        console.error(`Recipe with ID ${output.id} not found.`);
        return;
      }
      recipe.ingredients.forEach((ingredient) => {
        const [ingredientId, ingredientAmount] = Object.entries(ingredient)[0];
        if (isNaN(ingredientAmount)) {
          console.warn(`Invalid ingredient amount for ingredient ${ingredientId}. Skipping.`);
          return;
        }
        if (!worldRawResources[ingredientId]) {
          return;
        }
        const resource = worldRawResources[ingredientId];
        worldRawResources[ingredientId].amount = resource.amount - ingredientAmount * output.amount;
      });
    });
  });
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
};

const clearAll = () => {
  factories.length = 0;
  dependencies.value.length = 0;
  updateWorldRawResources();
};

const showHideAll = (mode: 'show' | 'hide') => {
  factories.forEach((factory) => (factory.hidden = mode === 'hide'));
};

const toggleHelp = () => {
  helpText.value = !helpText.value;
};

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
