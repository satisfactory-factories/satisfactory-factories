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
        @clear-all="clearAll"
        @show-demo="showDemo"
      />
      <v-divider thickness="2px" color="#ccc"></v-divider>
      <planner-factory-list
        :groups="groups"
        @create-group="createGroup"
      />
    </v-navigation-drawer>
    <v-row>
      <!-- Sticky Sidebar for Desktop -->
      <v-col class="d-none d-md-flex sticky-sidebar" cols="2">
        <v-container class="pa-0">
          <planner-factory-list
            :groups="groups"
            @create-group="createGroup"
          />
          <v-divider thickness="2px" color="#ccc"></v-divider>
          <planner-global-actions
            class="pt-4"
            @clear-all="clearAll"
            @show-demo="showDemo"
            @show-all="showHideAll('show')"
            @hide-all="showHideAll('hide')"
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
          <planner-world-resources :worldRawResources="worldRawResources"/>

          <v-row
            v-for="(group, index) in groups"
            :key="index"
          >
            <v-col>
              <v-card :id="group.id" :style="groupStyling(group)">
                <v-row style="padding: 16px">
                  <v-col class="text-h4">
                    <i class="fas fa-industry"></i> <input v-model="group.name" class="w-auto"
                                                           placeholder="Group Name" @input="updateGroup(group)"/>
                  </v-col>
                  <v-col align-self="center" class="text-right">
                    <v-btn v-show="!group.hidden" color="primary" prepend-icon="fas fa-eye-slash" variant="outlined"
                           @click="group.hidden = true">Hide
                    </v-btn>
                    <v-btn v-show="group.hidden" color="primary" prepend-icon="fas fa-eye" variant="outlined"
                           @click="group.hidden = false">Show
                    </v-btn>
                    <v-btn class="ml-4" color="red" prepend-icon="fas fa-trash" variant="outlined"
                           @click="confirmDelete() && clearGroup(group)">Delete Group
                    </v-btn>
                  </v-col>
                </v-row>
                <v-divider color="white" thickness="2px"></v-divider>
                <v-card-text v-show="!group.hidden">
                  <!------------------>
                  <!-- Products -->
                  <h1 class="text-h5 mb-4"><i class="fas fa-conveyor-belt-alt"></i> Products</h1>
                  <p class="text-body-2 mb-4">
                    <i class="fas fa-info-circle"/> Products that are created within the factory. Products are first
                    used to fulfil recipes internally, and any surplus is then shown in Outputs for export or
                    sinking.<br>
                    e.g. if you add 200 Iron Rods and also 100 Screws, you'd have 100 surplus Rods remaining used as an
                    Output (and the Screws).<br>
                    This way you know exactly how much of a part you need to make to fulfil both the factory itself and
                    any other factories that use this one as an Input.
                  </p>
                  <v-row v-for="(product, productIndex) in group.products" :key="productIndex"
                         style="padding: 0; margin: 10px 0">
                    <v-autocomplete
                      v-model="product.id"
                      :items="autocompletePartItems"
                      hide-details
                      label="Item"
                      max-width="400px"
                      prepend-icon="fas fa-cube"
                      style="margin-right: 25px"
                      variant="outlined"
                      @update:modelValue="updateProductSelection(product, group)"
                    >
                    </v-autocomplete>
                    <v-autocomplete
                      v-model="product.recipe"
                      :disabled="!product.id"
                      :items="getRecipesForPartsSelectorFormatted(product.id)"
                      hide-details
                      label="Recipe"
                      max-width="400px"
                      prepend-icon="fas fa-hat-chef"
                      style="margin-right: 10px"
                      variant="outlined"
                      @update:modelValue="updateGroup(group)"
                    >
                    </v-autocomplete>
                    <v-text-field
                      v-model.number="product.amount"
                      hide-details
                      label="Amount"
                      max-width="125px"
                      style="margin-right: 10px"
                      type="number"
                      variant="outlined"
                      @input="updateGroup(group)"
                    />
                    <v-btn color="red" icon="fas fa-trash" rounded="0"
                           @click="deleteProduct(productIndex, group)"></v-btn>
                  </v-row>
                  <v-btn color="primary" prepend-icon="fas fa-cube" ripple variant="flat"
                         @click="addEmptyProduct(index)">Add Product
                  </v-btn>

                  <v-divider class="my-4" color="white" thickness="2px"></v-divider>
                  <!------------------>
                  <!-- Imports -->
                  <h1 class="text-h5 mb-4"><i class="fas fa-arrow-to-right"/> Imports</h1>
                  <div v-if="Object.keys(group.rawResources).length > 0 || Object.keys(group.partsRequired).length > 0">
                    <v-card v-if="Object.keys(group.rawResources).length > 0" class="mb-4 border">
                      <v-card-title><i class="fas fa-hard-hat"/> Raw Resources</v-card-title>
                      <v-card-text>
                        <div v-for="(inputIndex) in group.rawResources" :key="inputIndex">
                          <p class="text-body-2 mb-4">
                            <i class="fas fa-info-circle"/> Raw resources (e.g. Iron Ore) aren't defined as imports. It
                            is assumed you'll supply them sufficiently.
                          </p>
                          <p v-for="(resource, resourceIndex) in group.rawResources" :key="resourceIndex"
                             class="text-body-1 mt-4">
                            <b>{{ resource.name }}</b>: {{ resource.amount }}/min
                          </p>
                        </div>
                      </v-card-text>
                    </v-card>
                    <v-row v-for="(input, inputIndex) in group.inputs" :key="inputIndex"
                           style="padding: 0; margin: 10px 0">
                      <v-autocomplete
                        v-model="input.groupId"
                        :items="autocompleteInputFactoriesForGroup(group)"
                        hide-details
                        label="Factory"
                        max-width="400px"
                        prepend-icon="fas fa-industry"
                        style="margin-right: 20px"
                        variant="outlined"
                        @update:modelValue="updateGroup(group)"
                      >
                      </v-autocomplete>
                      <v-autocomplete
                        v-model="input.outputPart"
                        :items="getGroupOutputsForAutocomplete(input.groupId)"
                        hide-details
                        label="Product"
                        max-width="400px"
                        prepend-icon="fas fa-cube"
                        style="margin-right: 20px"
                        variant="outlined"
                        @update:modelValue="updateGroup(group)">
                      </v-autocomplete>
                      <v-text-field
                        v-model.number="input.amount"
                        hide-details
                        label="Amount"
                        max-width="125px"
                        style="margin-right: 10px"
                        type="number"
                        variant="outlined"
                        @input="updateGroup(group)"
                      />
                      <v-btn
                        color="red"
                        icon="fas fa-trash"
                        rounded="0"
                        @click="deleteInput(inputIndex, group)"/>
                    </v-row>
                    <v-btn
                      v-show="Object.keys(group.partsRequired).length > 0"
                      :disabled="validGroupsForInputs.length === 0"
                      color="green"
                      prepend-icon="fas fa-dolly"
                      ripple
                      @click="addEmptyInput(group)"
                    >Add Import <span
                      v-if="validGroupsForInputs.length === 0">(Add another Factory with Exports!)</span>
                    </v-btn>
                  </div>
                  <p v-else class="text-body-1">Awaiting product selection.</p>

                  <v-divider class="my-4" color="white" thickness="2px"></v-divider>
                  <!------------------>
                  <!-- Satisfaction -->
                  <h2
                    v-show="group.inputsSatisfied"
                    class="text-h5 mb-4"
                  >
                    <i class="fas fa-check"/>
                    Satisfaction
                  </h2>
                  <h2
                    v-show="!group.inputsSatisfied"
                    class="text-h5 mb-4"
                    style="color: red"
                  >
                    <i class="fas fa-times-square"/>
                    Satisfaction
                  </h2>

                  <div v-if="Object.keys(group.partsRequired).length > 0">
                    <p class="text-body-2 mb-4">
                      <i class="fas fa-info-circle"/> All entries are listed as [supply/demand]. Supply is created by
                      adding imports to the factory.
                    </p>

                    <v-list bg-color="transparent">
                      <v-list-item
                        v-for="(part, partIndex) in group.partsRequired"
                        :key="`${partIndex}-${part.satisfied}`"
                        :style="isSatisfiedStyling(group, partIndex)"
                      >
                        <template v-slot:prepend="{ item }">
                          <v-icon v-show="part.satisfied" icon="fas fa-check"/>
                          <v-icon v-show="!part.satisfied" icon="fas fa-times"/>
                        </template>
                        <b>{{ getPartDisplayName(partIndex) }}</b>: {{ part.amountSupplied }}/{{ part.amountNeeded }}
                        /min
                      </v-list-item>
                    </v-list>
                  </div>
                  <p v-else class="text-body-1">Awaiting product selection or requirements outside of Raw Resources.</p>
                  <v-divider class="my-4" color="white" thickness="2px"></v-divider>

                  <!------------------>
                  <!-- Outputs -->
                  <h2 class="text-h5 mb-4"><i class="fa fa-truck-container"/> Outputs</h2>

                  <div v-if="group.products.length > 0">
                    <p class="text-body-2 mb-4">
                      <i class="fas fa-info-circle"/> Items listed below are the surplus of products available for
                      export. They can be exported to other factories or sunk. To set up an export, create a new factory
                      and use this factory as an import.
                    </p>
                    <p v-if="group.surplus && Object.keys(group.surplus).length === 0" class="text-body-1">No surplus
                      products yet. Add a product!</p>

                    <div v-if="group.surplus && Object.keys(group.surplus).length > 0">
                      <v-card
                        v-for="(surplusAmount, part) in group.surplus"
                        :key="`${group.id}-${part}`"
                        :style="requestStyling(getRequestMetricsForGroupByPart(group, part))"
                        class="border-b"
                        rounded="0">
                        <v-card-title><b>{{ getPartDisplayName(part) }}</b></v-card-title>
                        <v-card-text class="text-body-1">

                          <p><b>Surplus</b>: {{ surplusAmount }}/min</p>
                          <div v-if="getRequestsForGroupByProduct(group, part).length > 0">
                            <p><b>Requests total</b>: {{ getRequestMetricsForGroupByPart(group, part).request }}/min</p>
                            <p>Status:
                              <span v-if="getRequestMetricsForGroupByPart(group, part).isRequestSatisfied"
                                    style="color: green"><b>Satisfied</b></span>
                              <span v-if="!getRequestMetricsForGroupByPart(group, part).isRequestSatisfied"
                                    style="color: red"><b>Shortage!</b></span>
                            </p>
                            <div class="my-4">
                              <p class="text-h6"><b>Requesting factories:</b></p>
                              <ul class="ml-4">
                                <li v-for="request in getRequestsForGroupByProduct(group, part)" :key="request.group">
                                  <b>{{ findGroup(request.group).name }}</b>: {{ request.amount }}/min
                                </li>
                              </ul>
                              <segmented-bar :max-value="surplusAmount" :requests="requests"/>
                            </div>
                          </div>
                          <p v-else>There are currently no requests upon this product.</p>
                          <v-radio-group
                            v-model="group.surplusHandling[part]"
                            class="radio-fix d-inline mb-4"
                            density="compact"
                            hide-details
                            inline
                            @update:modelValue="updateGroup(group)"
                          >
                            <v-radio class="mr-4" label="Export" value="export"></v-radio>
                            <v-radio label="Sink" value="sink"></v-radio>
                          </v-radio-group>
                        </v-card-text>
                      </v-card>
                    </div>
                  </div>
                  <p v-else class="text-body-1">Awaiting product selection.</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
  </v-container>


  <!-- Debugging -->
  <div>
    Groups:
    <pre style="text-align: left">{{ JSON.stringify(groups, null, 2) }}</pre>
    Dependencies:
    <pre style="text-align: left">{{ JSON.stringify(dependencies, null, 2) }}</pre>

  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';

import PlannerGlobalActions from "@/components/planner/PlannerGlobalActions.vue";
import SegmentedBar from "@/components/SegmentedBar.vue";
import {Group, GroupDependency, GroupProduct, WorldRawResource} from "@/interfaces/planner/Group";
import {DataInterface} from "@/interfaces/DataInterface";
import Todo from "@/components/planner/Todo.vue";

export default defineComponent({
  name: 'Planner',
  components: {
    Todo,
    SegmentedBar,
    PlannerGlobalActions,
  },
  props: {
    data: {
      type: Object as PropType<DataInterface>,
      required: true
    },
  },
  data() {
    return {
      groups: JSON.parse(localStorage.getItem('factoryGroups') || '[]') as Group[],
      worldRawResources: {} as { [key: string]: WorldRawResource },
      dependencies: JSON.parse(localStorage.getItem('factoryDependencies') || '[]') as GroupDependency[],
      drawer: ref(false),
      requests: [
        {
          factory: 'Factory 1',
          amount: 500,
        },
        {
          factory: 'Factory 2',
          amount: 50,
        },
        {
          factory: 'Factory 3',
          amount: 25,
        },
      ],
    }
  },
  created() {
    this.worldRawResources = this.generateRawResources();
    this.updateWorldRawResources();

    // Add a dummy factory if there isn't any
    if (this.groups.length === 0) {
      this.createGroup('My first factory');
    }
  },
  computed: {
    validGroupsForInputs() {
      return this.groups.filter((group) => {
        const groupOutputs = Object.keys(group.products);
        if (groupOutputs.length === 0) {
          return false
        }

        // Check if the surplus for each factory is greater than 0
        // Object looks like this { 'IronIngot': 1000, 'IronRod': 1000 }, if they are all set to 0 the factory is not valid.
        const groupSurplus = Object.values(group.surplus);
        if (groupSurplus.every(surplus => surplus === 0)) {
          return false
        }

        // If all group products are not valid, the group is not valid.
        // Validity means each output has an ID and an amount more than 0.
        return groupOutputs.every(output => group.products[output].id && group.products[output].amount > 0);
      });
    },
    autocompletePartItems() {
      return Object.entries(this.data.items.parts).map(([key, displayName]) => {
        return {
          value: key,               // The key to use as the value
          title: displayName // The display name to show
        };
      }).sort((a, b) => a.title.localeCompare(b.title));
    },
  },
  watch: {
    groups: {
      handler() {
        localStorage.setItem('factoryGroups', JSON.stringify(this.groups));
      },
      deep: true,
    },
    dependencies: {
      handler() {
        localStorage.setItem('factoryDependencies', JSON.stringify(this.dependencies));
      },
      deep: true,
    },
  },
  methods: {
    toggleDrawer() {
      this.drawer = !this.drawer;
    },
    confirmDelete(message = 'Are you sure?') {
      return confirm(message);
    },
    showHideAll(mode: 'show' | 'hide') {
      this.groups.forEach(group => group.hidden = mode === 'hide');
    },
    autocompleteInputFactoriesForGroup(group: Group) {
      // Get the current list of all valid inputs
      const validInputs = this.validGroupsForInputs;

      // Filter the valid inputs by group that is not the current
      const relevantInputs = validInputs.filter((input) => input.id !== group.id);

      // Now create an array in the format of { title: 'group.name', value: 'groupid' }
      return relevantInputs.map((input) => {
        return {
          title: input.name,
          value: input.id,
        };
      });
    },
    updateProductSelection(product: GroupProduct, group: Group) {
      // If the user update's the product within the item selection, we need to wipe the recipe otherwise the user could somehow put in invalid recipes for the product.
      product.recipe = '';

      // If there is only one recipe for the product just automatically select it
      const recipes = this.getRecipesForPart(product.id);
      if (recipes.length === 1) {
        product.recipe = recipes[0].id;
      }
      this.updateGroup(group)
    },
    clearAll() {
      console.log('clearAll');
      this.groups = [];
      this.dependencies = [];
      this.updateWorldRawResources();
    },

    // ==== GLOBALS
    // Resets the world's raw resources counts according to the limits provided by the data.
    generateRawResources(): { [key: string]: WorldRawResource } {
      this.worldRawResources = {};

      let ores = {} as { [key: string]: WorldRawResource };

      Object.keys(this.data.items.rawResources).forEach((name) => {
        const resource = this.data.items.rawResources[name];
        ores[name] = {
          name: resource.name,
          amount: resource.limit,
        }
      });

      return ores;
    },
    calculateDependencies(): GroupDependency {
      const newDependencies: GroupDependency = {};

      // Iterate through groups to build the initial dependencies with requests
      this.groups.forEach(group => {
        group.inputs.forEach(input => {
          // Check if the input is actually still valid, if the user has set an resource to sink this is no longer valid.
          // We do this by checking the requested group to see if the surplus is still there.
          const requestedGroup = this.groups.find(g => g.id === input.groupId);

          // We need to pick up on the following conditions:
          // 1. The group is no longer valid (e.g. the user has set it to sink)
          // 2. The group is valid but the product is no longer available, BUT not if it's undefined e.g. "" because the UI is still being edited.
          if (!requestedGroup || !requestedGroup.surplus[input.outputPart] && input.outputPart !== "") {
            console.warn('Input is no longer valid, removing it.', input);
            // Remove the input from the group
            group.inputs = group.inputs.filter(i => i !== input);

            // Run the requirements check again just for this affected group
            this.updateGroup(group);
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
          if (!newDependencies[input.groupId].requestedBy[group.id]) {
            newDependencies[input.groupId].requestedBy[group.id] = [];
          }

          // Add the requests to the appropriate group
          newDependencies[input.groupId].requestedBy[group.id].push(request);
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
        const thisGroup = this.groups.find(group => group.id === parseInt(groupDepId));

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
    },

    // ==== HELPERS
    isSatisfiedStyling(group: Group, requirement: string | number) {
      return group.partsRequired[requirement].satisfied ? 'color: green' : 'color: red';
    },
    getPartDisplayName(part: string | number) {
      return this.data.items.rawResources[part]?.name || this.data.items.parts[part];
    },

    groupStyling(group: Group) {
      const satisfied = group.inputsSatisfied && this.areAllRequestsSatisfiedForGroup(group);

      return {
        border: `1px solid ${satisfied ? 'rgb(108, 108, 108)' : '#dc3545'}`,
        backgroundColor: `${satisfied ? 'rgba(43, 43, 43, 0.4)' : 'rgba(140, 9, 21, 0.4)'}`,
      };
    },
    requestStyling(requestMetric: GroupDependencyRequestMetrics) {
      // If no requests, return nothing
      if (Object.keys(requestMetric).length === 0) {
        return {};
      }

      return {
        border: requestMetric.isRequestSatisfied ? '' : '1px solid red',
        borderBottom: requestMetric.isRequestSatisfied ? '' : '1px solid red !important',
      }
    },
    areAllRequestsSatisfiedForGroup(group: Group) {
      const requests = this.getGroupDependencies(group);

      if (!requests || Object.keys(requests).length === 0) {
        // No requests, assume satisfied
        return true;
      }

      return Object.keys(requests.metrics).every(part => requests.metrics[part].isRequestSatisfied);
    },
    getRecipesForPart(part: string) {
      return this.data.recipes.filter((recipe) => {
        return recipe.product[part] || undefined
      });
    },
    getRecipesForPartsSelectorFormatted(part: string) {
      // Return each recipe in the format of { title: 'Recipe Name', value: 'Recipe ID' }
      return this.data.recipes
        .filter((recipe) => recipe.product[part] || undefined)
        .map((recipe) => {
          return {
            title: recipe.displayName,
            value: recipe.id,
          };
        });
    },

    // ==== GROUPS
    createGroup(name = 'A new factory') {
      this.groups.push({
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
    },
    clearGroup(groupIndex: number) {
      this.groups.splice(groupIndex, 1);
      this.updateWorldRawResources();

      // When a group is cleared, we need to trigger updates to all groups to ensure consistency.
      this.groups.forEach(group => this.updateGroup(group));
    },
    findGroup(groupId: string | number): Group {
      const group = this.groups.find(group => group.id === parseInt(groupId));
      if (!group) {
        throw new Error(`Group ${groupId} not found!`);
      }
      return group
    },
    // Gets the products of another group for dependencies
    getGroupOutputsForAutocomplete(groupId: number | undefined): string[] {
      if (groupId !== 0 && !groupId) {
        console.error('Tried to get products for an undefined group ID.');
        return [];
      }

      // Get the group by ID, we can't use [ref]
      const group = this.groups.find(group => group.id === groupId);

      if (!group || !group.id) {
        console.error('Tried to get products for a group that does not exist:', groupId);
        return [];
      }

      if (Object.values(group.products).length === 0) {
        console.error('Tried to get outputs of a group with no products.');
        return [];
      }

      // Ensure that we're not returning the same factory as requested, and return as an array for rendering.
      // It must be in the format of [ { title: 'Item Name', value: 'Item ID' } ]
      return Object.keys(group.surplus).map((item) => {
        return {
          title: this.getPartDisplayName(item),
          value: item,
        };
      });
    },
    updateGroup(group: Group) {
      this.updateWorldRawResources();
      this.updateGroupRequirements(group);
      this.checkGroupPartSatisfaction(group);
      this.dependencies = this.calculateDependencies();
    },
    // This function calculates the world resources available after each group has consumed Raw Resources.
    // This is done here globally as it loops all groups. It is not appropriate to be done on group updates.
    updateWorldRawResources(): void {
      // Generate fresh world resources as a baseline for calculation.
      this.worldRawResources = this.generateRawResources();

      // Loop through each group's products to calculate usage of raw resources.
      this.groups.forEach(group => {
        group.products.forEach(output => {
          const recipe = this.data.recipes.find(r => r.id === output.recipe);
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

            if (!this.worldRawResources[ingredientId]) {
              return;
            }

            const resource = this.worldRawResources[ingredientId];

            // Update the world resource by reducing the available amount.
            this.worldRawResources[ingredientId].amount = resource.amount - (ingredientAmount * output.amount)
          });
        });
      });
    },

    updateGroupRequirements(group: Group) {
      group.partsRequired = {};
      group.rawResources = {};
      group.surplus = {};

      // First loop through each product and add it to internal requirements and surplus.
      group.products.forEach(product => {
        const recipe = this.data.recipes.find(r => r.id === product.recipe);
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
          const isRaw = !!this.data.items.rawResources[part];
          if (isRaw) {
            if (!group.rawResources[part]) {
              group.rawResources[part] = {
                name: this.data.items.rawResources[part].name,
                amount: 0,
              };
            }
            group.rawResources[part].amount = partAmount * product.amount;
            group.rawResources[part].satisfied = true;
          } else {
            if (!group.partsRequired[part]) {
              group.partsRequired[part] = {
                amountNeeded: 0,
                amountSupplied: 0,
                satisfied: true, // So we don't get a big red bot as soon as we add a product.
              };
            }

            group.partsRequired[part].amountNeeded += partAmount * product.amount;

            // Check satisfaction
            if (!group.partsRequired[part].amountSupplied <= group.partsRequired[part].amountNeeded) {
              group.partsRequired[part].satisfied = false;
            }
          }
        });

        // Any remaining product that is not used internally is surplus.
        if (!group.surplus[product.id]) {
          group.surplus[product.id] = 0;

          // If the handling isn't already set (so we don't blow it away again)
          if (!group.surplusHandling[product.id]) {
            group.surplusHandling[product.id] = 'export'; // Assume user will export it by default
          }
        }

        // If the user has chosen to sink the resources, we don't need to calculate the surplus and zero it out
        if (group.surplusHandling[product.id] === 'sink') {
          group.surplus[product.id] = 0;
        } else {
          group.surplus[product.id] += product.amount;
        }
      });

      // Satisfy internal requirements with existing group products (like screws from iron rods).
      Object.keys(group.partsRequired).forEach(part => {
        // If it's raw, don't bother
        if (!group.partsRequired[part]) {
          return;
        }

        const requirement = group.partsRequired[part];

        group.products.forEach(product => {
          if (product.id === part) {
            const usedAmount = Math.min(product.amount, requirement.amountNeeded - requirement.amountSupplied);
            requirement.amountSupplied += usedAmount;

            // Reduce surplus amount accordingly.
            if (group.surplus[product.id]) {
              group.surplus[product.id] = Math.max(0, group.surplus[product.id] - usedAmount);
            }

            requirement.satisfied = requirement.amountSupplied >= requirement.amountNeeded;
          }
        });
      });
    },

    // Calculate the inputs required to satisfy the group's parts requirements.
    checkGroupPartSatisfaction(group: Group) {
      // Calculate based on the inputs of the group if the requirements are satisfied.
      Object.keys(group.inputs).forEach(input => {
        const part = group.inputs[input].outputPart;
        const requirement = group.partsRequired[part];

        if (!requirement) {
          console.error(`Part ${part} not found in requirements.`);
          return;
        }

        // How get the amount of supply provided by the input
        requirement.amountSupplied += group.inputs[input].amount

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
      group.inputsSatisfied = Object.keys(group.partsRequired).every(part => group.partsRequired[part].satisfied);
    },
    getGroupDependencies(group: Group) {
      return this.dependencies[group.id] ?? {};
    },

    getRequestsForGroupByProduct(group: Group | string, part: string): GroupDependencyRequest[] {
      // If sent an empty group, there's no request.
      if (!group) {
        return [];
      }
      // Return an object containing the requests of all factories requesting a particular part
      // We need to get all requests set upon by other factories and check their part names
      // If the part name matches the one we're looking for, we add it to the list.
      const groupIdStr = group.id.toString() // JavaScript doing bullshit things
      const groupRequests = this.dependencies[groupIdStr]?.requestedBy;

      if (!groupRequests) {
        return []
      }

      // Create a new object returning the requests for the specific part, injecting the group ID.
      // They can only ever request one part from us, so return it as a flat array.
      return Object.entries(groupRequests).map(([groupId, requests]) => {
        return requests.filter(request => request.part === part).map(request => {
          return {
            ...request,
            group: groupId,
          };
        });
      }).flat();
    },
    getRequestMetricsForGroupByPart(group: Group, part: string): GroupDependencyRequestMetrics {
      // Requests may be empty.
      if (!group || !part || !group.id) {
        return {};
      }

      // Dependency may be empty.
      if (!this.dependencies[group.id.toString()]) {
        return {};
      }
      return this.dependencies[group.id.toString()].metrics[part] ?? {};
    },

    // ==== INPUTS
    addEmptyInput(group: Group) {
      group.inputs.push({
        groupId: 0,
        outputPart: '',
        amount: 0,
      });
    },
    deleteInput(inputIndex: number, group: Group) {
      group.inputs.splice(inputIndex, 1)
      this.updateGroup(group)
    },

    // ==== PRODUCTS
    addEmptyProduct(groupIndex: number) {
      this.groups[groupIndex].products.push({
        id: '',
        amount: 0,
      });
    },
    deleteProduct(outputIndex: number, group: Group) {
      group.products.splice(outputIndex, 1)
      this.updateGroup(group);
    },
    isOutputSelected(output, currentInputIndex, group: Group) {
      // Check if the output is already selected by another input, except the current one
      return group.inputs.some((input, index) => index !== currentInputIndex && input.outputPart === output);
    },

    showDemo() {
      this.groups = [
        {
          "id": 0,
          "name": "Iron Ingot Fac",
          "products": [
            {
              "id": "IronIngot",
              "amount": 1000,
              "recipe": "IngotIron"
            }
          ],
          "inputs": [],
          "partsRequired": {
            "OreIron": {
              "amountNeeded": 1000,
              "amountSupplied": 1000,
              "satisfied": true
            }
          },
          "inputsSatisfied": true,
          "rawResources": []
        },
        {
          "id": 1,
          "name": "Iron MegaFac",
          "products": [
            {
              "id": "IronPlate",
              "amount": 200,
              "recipe": "IronPlate"
            },
            {
              "id": "IronRod",
              "amount": 100,
              "recipe": "IronRod"
            }
          ],
          "inputs": [
            {
              "groupId": 0,
              "outputPart": "IronIngot",
              "amount": 700
            }
          ],
          "partsRequired": {
            "IronIngot": {
              "amountNeeded": 700,
              "amountSupplied": 700,
              "satisfied": true
            }
          },
          "inputsSatisfied": true,
          "rawResources": []
        },
        {
          "id": 2,
          "name": "Screws",
          "products": [
            {
              "id": "IronScrew",
              "amount": 1000,
              "recipe": "Screw"
            }
          ],
          "inputs": [
            {
              "groupId": 1,
              "outputPart": "IronRod",
              "amount": 1000
            }
          ],
          "partsRequired": {
            "IronRod": {
              "amountNeeded": 1000,
              "amountSupplied": 1000,
              "satisfied": true
            }
          },
          "inputsSatisfied": true,
          "rawResources": []
        },
        {
          "id": 3,
          "name": "RIPs",
          "products": [
            {
              "id": "IronPlateReinforced",
              "amount": 20,
              "recipe": "IronPlateReinforced"
            }
          ],
          "inputs": [
            {
              "groupId": 1,
              "outputPart": "IronPlate",
              "amount": 120
            },
            {
              "groupId": 2,
              "outputPart": "IronScrew",
              "amount": 240
            }
          ],
          "partsRequired": {
            "IronPlate": {
              "amountNeeded": 120,
              "amountSupplied": 120,
              "satisfied": true
            },
            "IronScrew": {
              "amountNeeded": 240,
              "amountSupplied": 240,
              "satisfied": true
            }
          },
          "inputsSatisfied": true,
          "rawResources": []
        }
      ]
    },
  }
});
</script>

<style lang="scss" scoped>
.radio-fix {
  ::v-deep label {
    margin-left: 5px;
  }

  * {
    opacity: 100;
  }
}
.sticky-sidebar {
  position: sticky;
  width: 100%;
  top: 0;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}
</style>
