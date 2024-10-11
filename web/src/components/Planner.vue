<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>Todo</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>When a group is deleted, the dependants are not properly updated. Need to check if inputs are still valid and if not delete them.</v-list-item>
              <v-list-item>Bug: The Requests is not correctly picking up they are being satisfied resulting in red text always. Probably broke the calculation somewhere.</v-list-item>
              <v-list-item>Bug: Imports are not correctly showing raw resources.</v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>World ores available</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item v-for="ore in worldRawResources" :key=ore.name>{{ ore.name }}: {{ ore.amount }}</v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row align-content="center">
      <v-col>
        <v-btn-group>
          <v-btn color="primary" @click="createGroup" prepend-icon="fas fa-plus" ripple>Create New Factory</v-btn>
          <v-btn color="green" @click="setTemplate" prepend-icon="fas fa-clipboard-list" ripple>Template</v-btn>
          <v-btn color="red" @click="confirmDelete('Are you really sure? This will delete literally everything!') && clearAll()" prepend-icon="fas fa-trash">Clear</v-btn>
        </v-btn-group>
      </v-col>
    </v-row>
  </v-container>
  <v-container
    v-for="(group, index) in groups"
    :key="index"
  >
    <v-row>
      <v-col cols="12">
        <v-card :style="groupStyling(group)">
          <v-row style="padding: 16px">
            <v-col class="text-h4">
              <i class="fas fa-industry"></i> <input v-model="group.name" @input="updateGroup(group)" placeholder="Group Name" class="w-auto"/>
            </v-col>
            <v-col align-self="center" class="text-right">
              <v-btn color="primary" v-show="!group.hidden" prepend-icon="fas fa-eye-slash" variant="outlined" @click="group.hidden = true">Hide</v-btn>
              <v-btn color="primary" v-show="group.hidden" prepend-icon="fas fa-eye" variant="outlined" @click="group.hidden = false">Show</v-btn>
              <v-btn color="red" class="ml-4" prepend-icon="fas fa-trash" variant="outlined" @click="confirmDelete() && clearGroup(group)">Delete Group</v-btn>
            </v-col>
          </v-row>
          <v-divider thickness="2px" color="white"></v-divider>
          <v-card-text v-show="!group.hidden">
            <!------------------>
            <!-- Products -->
            <h1 class="text-h5 mb-4"><i class="fas fa-box"></i> Products</h1>
            <p class="text-body-2">
              <i class="fas fa-info-circle" /> Products that are created within the factory. Products are first used to fulfil recipes internally, and any surplus is then shown in Outputs for export or sinking.<br>
              e.g. if you add 200 Iron Rods and also 100 Screws, you'd have 100 surplus Rods remaining used as an Output (and the Screws).<br>
              This way you know exactly how much of a part you need to make to fulfil both the factory itself and any other factories that use this one as an Input.
            </p>
            <v-row v-for="(product, productIndex) in group.products" :key="productIndex" style="padding: 0; margin: 10px 0">
              <v-autocomplete
                label="Item"
                :items="autocompletePartItems"
                v-model="product.id"
                variant="outlined"
                @update:modelValue="updateProductSelection(product, group)"
                hide-details
                max-width="400px"
                prepend-icon="fas fa-cube"
                style="margin-right: 25px"
              >
              </v-autocomplete>
              <v-autocomplete
                label="Recipe"
                :items="getRecipesForPartsSelectorFormatted(product.id)"
                :disabled="!product.id"
                v-model="product.recipe"
                variant="outlined"
                @update:modelValue="updateGroup(group)"
                hide-details
                max-width="400px"
                prepend-icon="fas fa-hat-chef"
                style="margin-right: 10px"
              >
              </v-autocomplete>
              <v-text-field
                label="Amount"
                v-model.number="product.amount"
                type="number"
                variant="outlined"
                @input="updateGroup(group)"
                hide-details
                max-width="125px"
                style="margin-right: 10px"
              />
              <v-btn color="red" rounded="0" icon="fas fa-trash" @click="deleteProduct(productIndex, group)"></v-btn>
            </v-row>
            <v-btn color="primary" prepend-icon="fas fa-cube" ripple variant="flat" @click="addEmptyProduct(index)">Add Product</v-btn>

            <v-divider class="my-4" thickness="2px" color="white"></v-divider>
            <!------------------>
            <!-- Imports -->
            <h1 class="text-h5 mb-4"><i class="fas fa-arrow-to-right" /> Imports</h1>
            <p class="text-body-2">
              <i class="fas fa-info-circle" /> Raw resources (e.g. Iron Ore) don't require defining as imports. It is assumed you'll supply them sufficiently.
            </p>
            <div v-for="(inputIndex) in group.rawResources" :key="inputIndex">
              <p>Raw Resources:</p>
              <div v-for="(resource, resourceIndex) in group.rawResources" :key="resourceIndex">
                <p>{{ resource.name }}: {{ resource.amount }}/m</p>
              </div>
            </div>
            <v-row v-for="(input, inputIndex) in group.inputs" :key="inputIndex" style="padding: 0; margin: 10px 0">
              <v-autocomplete
                label="Factory"
                :items="autocompleteInputFactoriesForGroup(group)"
                v-model="input.groupId"
                variant="outlined"
                @update:modelValue="updateGroup(group)"
                hide-details
                prepend-icon="fas fa-industry"
                max-width="400px"
                style="margin-right: 20px"
              >
              </v-autocomplete>
              <v-autocomplete
                label="Product"
                :items="getGroupOutputsForAutocomplete(input.groupId)"
                v-model="input.outputPart"
                variant="outlined"
                @update:modelValue="updateGroup(group)"
                hide-details
                prepend-icon="fas fa-cube"
                max-width="400px"
                style="margin-right: 20px">
              </v-autocomplete>
              <v-text-field
                label="Amount"
                v-model.number="input.amount"
                type="number"
                variant="outlined"
                @input="updateGroup(group)"
                hide-details
                max-width="125px"
                style="margin-right: 10px"
              />
              <v-btn
                color="red"
                rounded="0"
                icon="fas fa-trash"
                @click="deleteInput(inputIndex, group)" />
            </v-row>
            <v-btn
              color="green"
              prepend-icon="fas fa-dolly"
              ripple
              @click="addEmptyInput(group)"
              :disabled="validGroupsForInputs.length === 1"
            >Add Import <span v-if="validGroupsForInputs.length === 1">(Add another Factory with Exports!)</span>
            </v-btn>

            <v-divider class="my-4" thickness="2px" color="white"></v-divider>
            <!------------------>
            <!-- Satisfaction -->
            <h2
              class="text-h5 mb-4"
              :style="group.inputsSatisfied ? 'color: white' : 'color: red'"
            >
              <i :class="group.inputsSatisfied ? 'fas fa-check' : 'fas fa-times-square'" /> Satisfaction
            </h2>
            <p class="text-body-2">
              <i class="fas fa-info-circle" /> All entries are listed as [supply/demand]. Supply is created by adding inputs to the factory.
            </p>
            <p v-if="Object.keys(group.partsRequired).length === 0">No requirements yet. Add an output!</p>

            <v-list bg-color="transparent">
              <v-list-item
                v-for="(part, partIndex) in group.partsRequired"
                :key="`${partIndex}-${part.satisfied}`"
                :style="isSatisfiedStyling(group, partIndex)"
              >
                <template v-slot:prepend="{ item }" >
                  <v-icon v-show="part.satisfied" icon="fas fa-check" />
                  <v-icon v-show="!part.satisfied" icon="fas fa-times" />
                </template>
                <b>{{ getPartDisplayName(partIndex) }}</b>: {{ part.amountSupplied }}/{{ part.amountNeeded }} /min
              </v-list-item>
            </v-list>

            <v-divider class="my-4" thickness="2px" color="white"></v-divider>

            <!------------------>
            <!-- Exports -->
            <h2 class="text-h5 mb-4"><i class="fa fa-truck-container" /> Exports</h2>

            <p class="text-body-2">
              <i class="fas fa-info-circle" /> Surplus products are products that are created but not used internally. They can be exported to other factories or sunk.
            </p>
            <p class="text-body-1" v-if="group.surplus && Object.keys(group.surplus).length === 0">No surplus products yet. Add a product!</p>

            <div v-if="group.surplus && Object.keys(group.surplus).length > 0">
              <v-list bg-color="transparent">
                <v-list-item v-for="(surplusAmount, part) in group.surplus" :key="part">
                  <p class="text-body-1"><b>{{ getPartDisplayName(part) }}</b> surplus: {{ surplusAmount }}/min</p>
                  <v-radio-group
                    class="radio-fix d-inline"
                    density="compact"
                    inline
                    v-model="group.surplusHandling[part]"
                    @change="updateGroup(group)"
                  >
                    <v-radio label="Export" value="export" class="mr-4"></v-radio>
                    <v-radio label="Sink" value="sink"></v-radio>
                  </v-radio-group>
                </v-list-item>
              </v-list>
           </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>


    <!------------------>
    <!-- Dependencies -->
    <div v-if="getGroupDependencies(group).requestedBy">
      <h2>Requests</h2>
      <planner-requests :requests="getGroupDependencies(group)" :groups="groups" :data="data" />
    </div>
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
import {DataInterface} from "../interfaces/DataInterface.ts";

interface Group {
  id: number;
  name: string;
  inputs: Array<{
    groupId: number;
    outputPart: string;
    amount: number;
  }>;
  products: GroupProduct[];
  outputs: GroupProduct[];
  partsRequired: { [key: string]: { amount: number, amountOriginal: number, satisfied: boolean } };
  inputsSatisfied: boolean;
  rawResources: Array<{
    name: string;
    amount: number;
  }>;
  surplus: { [key: string]: number }; // Surplus products
  surplusHandling: { [key: string]: 'export' | 'sink' }; // How to handle surplus
  hidden: boolean; // Whether to hide the card or not
}

interface GroupDependency {
  outputGroupId: number;
  inputGroupId: number;
  outputPart: string;
  outputAmount: number;
}

interface GroupProduct {
  id: string;
  recipe: string;
  amount: number;
}

export interface RawResource {
  name: string;
  amount: number;
}

import PlannerRequests from "./PlannerRequests.vue";
export default defineComponent({
  name: 'Planner',
  components: {
    PlannerRequests
  },
  props: {
    data: {
      type: Object as PropType<DataInterface>,
      required: true,
    },
  },
  data() {
    return {
      groups: JSON.parse(localStorage.getItem('factoryGroups') || '[]') as Group[],
      worldRawResources: {} as { [key: string]: RawResource },
      dependencies: JSON.parse(localStorage.getItem('factoryDependencies') || '[]') as GroupDependency[],
    }
  },
  created() {
    this.generateRawResources();
    this.updateWorldRawResources();
  },
  computed: {
    validGroupsForInputs() {
      return this.groups.filter((group) => {
        const groupOutputs = Object.keys(group.products);
        if (groupOutputs.length === 0) {
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
    confirmDelete(message = 'Are you sure?') {
      return confirm(message);

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
    updateProductSelection(product, group: GroupProduct) {
      console.log('Product updated:', product, group);
      // If the user update's the product within the item selection, we need to wipe the recipe otherwise the user could somehow put in invalid recipes for the product.
      product.recipe = '';

      // If there is only one recipe for the product just automaticly select it
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
    generateRawResources() {
      this.worldRawResources = {};

      let ores = {} as { [key: string]: RawResource };

      Object.keys(this.data.items.rawResources).forEach((name) => {
        const resource = this.data.items.rawResources[name];
        ores[name] = {
          name: resource.name,
          amount: resource.limit,
        }
      });

      this.worldRawResources = ores;
    },
    calculateDependencies() {
      const newDependencies: { [key: string]: any } = {};

      // Iterate through groups to build the initial dependencies with requests
      this.groups.forEach(group => {
        group.inputs.forEach(input => {
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
        const thisGroup = this.groups[groupDepId];

        console.log(thisGroup)
        Object.keys(thisGroup.surplus).forEach(product => {
          const amount = thisGroup.surplus[product]; // Get the amount of the product from the surplus object


          if (groupDependency.metrics[product]) {
            groupDependency.metrics[product].supply = amount;
            groupDependency.metrics[product].isRequestSatisfied = amount >= groupDependency.metrics[product].request;
          }
        });
      });

      // Replace the existing dependencies with the new ones
      this.dependencies = newDependencies;
    },

    // ==== HELPERS
    isSatisfiedStyling(group: Group, requirement: string | number) {
      return group.partsRequired[requirement].satisfied ? 'color: green' : 'color: red';
    },
    getPartDisplayName(part: string | number) {
      return this.data.items.rawResources[part]?.name || this.data.items.parts[part];
    },

    groupStyling(group: Group) {
      return {
        border: `1px solid ${group.inputsSatisfied ? '#28a745' : '#dc3545'}`,
        backgroundColor: `${group.inputsSatisfied ? 'rgba(0, 66, 19, 0.4)' : 'rgba(140, 9, 21, 0.4)'}`,
      };
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
    createGroup() {
      this.groups.push({
        id: Math.floor(Math.random() * 10000),
        name: 'A new factory',
        products: [],
        inputs: [],
        partsRequired: {},
        inputsSatisfied: false,
        rawResources: [],
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
      this.calculateDependencies();
    },
    // This function calculates the world resources available after each group has consumed Raw Resources.
    // This is done here globally as it loops all groups. It is not appropriate to be done on group updates.
    updateWorldRawResources() {
      // Generate fresh world resources as a baseline for calculation.
      this.generateRawResources();

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

          if (!group.partsRequired[part]) {
            group.partsRequired[part] = {
              amountNeeded: 0,
              amountSupplied: 0,
              satisfied: false,
            };
          }

          // Update the group's input requirements.
          group.partsRequired[part].amountNeeded += partAmount * product.amount;

          // If it's a raw resource, mark it as fully supplied.
          const isRaw = !!this.data.items.rawResources[part];
          if (isRaw) {
            group.partsRequired[part].amountSupplied = group.partsRequired[part].amountNeeded;
            group.partsRequired[part].satisfied = true;
          }
        });

        // Any remaining product that is not used internally is surplus.
        if (!group.surplus[product.id]) {
          group.surplus[product.id] = 0;
        }

        group.surplus[product.id] += product.amount;
      });

      // Satisfy internal requirements with existing group products (like screws from iron rods).
      Object.keys(group.partsRequired).forEach(part => {
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

    setTemplate() {
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
</style>
