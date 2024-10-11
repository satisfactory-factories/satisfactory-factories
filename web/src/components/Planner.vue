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
          <v-btn color="primary" @click="createGroup" prepend-icon="fas fa-plus" ripple>Create New Group</v-btn>
          <v-btn color="green" @click="setTemplate" prepend-icon="fas fa-clipboard-list" ripple>Template</v-btn>
          <v-btn color="red" @click="clearAll" prepend-icon="fas fa-trash">Clear</v-btn>
        </v-btn-group>
      </v-col>
    </v-row>
  </v-container>
  <v-container
    v-for="(group, index) in groups"
    :key="index"
  >
    <!------------------>
    <!-- Products -->
    <v-row>
      <v-col>
        <v-card :style="groupStyling(group)">
          <v-row style="padding: 16px">
            <v-col cols="4 text-h4">
              <i class="fas fa-industry"></i> <input v-model="group.name" @input="updateGroup(group)" placeholder="Group Name" class="w-auto"/>
            </v-col>
            <v-col align-self="center" class="text-right">
              <v-btn color="red" prepend-icon="fas fa-trash" variant="outlined" @click="clearGroup(index)">Delete Group</v-btn>
            </v-col>
          </v-row>
          <v-divider thickness="2px" color="white"></v-divider>
          <v-card-text>
            <h1 class="text-h5 mb-4"><i class="fas fa-box"></i> Products</h1>
            <p class="text-caption mb-4">
              Products that are created within the factory. Products are first used to fulfil recipes internally, and any surplus is then shown in Outputs for export or sinking.<br>
              e.g. if you add 200 Iron Rods and also 100 Screws, you'd have 100 surplus Rods remaining used as an Output (and the Screws).<br>
              This way you know exactly how much of a part you need to make to fulfil both the factory itself and any other factories that use this one as an Input.
            </p>
            <v-row v-for="(product, productIndex) in group.products" :key="productIndex" style="padding: 0; margin: 10px 0">
              <v-autocomplete
                label="Item"
                :items="autocompleteItems"
                v-model="product.id"
                variant="outlined"
                @update:modelValue="updateProductSelection(product, group)"
                hide-details
                max-width="400px"
                style="margin-right: 10px"
              >
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props" prepend-icon="fas fa-cube" :title="item.title" />
                </template>
                <template v-slot:selection="{ item, props }">
                  <v-list-item v-bind="props" prepend-icon="fas fa-cube" :title="item.title" />
                </template>
              </v-autocomplete>
              <v-autocomplete
                label="Recipe"
                :items="getRecipesForPartAutoselectFormatted(product.id)"
                :disabled="!product.id"
                v-model="product.recipe"
                variant="outlined"
                @update:modelValue="updateGroup(group)"
                hide-details
                max-width="400px"
                style="margin-right: 10px"
              >
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props" prepend-icon="fas fa-hat-chef" :title="item.title" />
                </template>
                <template v-slot:selection="{ item, props }">
                  <v-list-item v-bind="props" prepend-icon="fas fa-hat-chef" :title="item.title" />
                </template>
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
            <v-btn color="primary" prepend-icon="fas fa-box" ripple variant="flat" @click="addEmptyProduct(index)">Add Product</v-btn>
              <v-btn color="secondary" prepend-icon="fas fa-truck-container" ripple @click="addEmptyInput">Add Input</v-btn>

          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <!------------------>
    <!-- Inputs -->
    <div style="margin-bottom: 15px; border-top: 1px solid #ccc">
      <h2>Inputs</h2>
      <p style="font-size: 14px">
        Raw resources (e.g. Iron Ore) don't require inputs. It is assumed you'll supply them sufficiently.
      </p>
      <div v-for="(inputIndex) in group.rawResources" :key="inputIndex" class="input-entry">
        <div v-if="group.rawResources.length > 0">
          <p>Raw Resources:</p>
          <div v-for="(resource, resourceIndex) in group.rawResources" :key="resourceIndex">
            <p>{{ resource.name }}: {{ resource.amount }}/m</p>
          </div>
        </div>
      </div>
      <div v-for="(input, inputIndex) in group.inputs" :key="inputIndex">
        <select v-model="input.groupId">
          <option v-for="(otherGroup, otherIndex) in validGroupsForInputs"
                  :key="otherIndex"
                  :value="otherIndex"
                  @change="updateGroup(group)"
                  :disabled="otherIndex === index"
          >
            {{ otherGroup.name }}
          </option>
        </select>
        <label>
          Output:
          <select v-model="input.outputPart" @change="updateGroup(group)" style="margin-right: 5px">
            <option v-for="output in getGroupOutputs(input.groupId)"
                    :key="output"
                    :value="output"
                    :disabled="output == input.groupId || isOutputSelected(output, inputIndex, group)"
            >
              {{ getPartDisplayName(output) }}
            </option>
          </select>
        </label>
        <label>
          <input type="number" v-model.number="input.amount" @input="updateGroup(group)" min="0" />
          /min
        </label>
        <button @click="deleteInput(inputIndex, group)" style="background-color: red">Del</button>
      </div>
      <button :disabled="validGroupsForInputs.length < 2" @click="addEmptyInput(group)" style="background-color: dodgerblue">+ <span v-if="groups.length < 2">(Add another group!)</span></button>
    </div>

    <!------------------>
    <!-- Satisfaction -->
    <div style="margin-bottom: 15px; border-top: 1px solid #ccc">
      <h2>Satisfaction</h2>
      <p v-if="Object.keys(group.partsRequired).length === 0">No requirements yet. Add an output!</p>
      <p v-if="Object.keys(group.partsRequired.length > 0)" style="font-size: 14px">
        All entries are listed as [supply/demand].<br>
        Supply is created by adding inputs to the factory.
      </p>
      <div v-for="(part, partIndex) in group.partsRequired" :key="partIndex" style="text-align: left">
        <p :style="isSatisfiedStyling(group, partIndex)">{{ getPartDisplayName(partIndex) }}: {{ part.amountSupplied }}/{{ part.amountNeeded }} /min</p>
      </div>
    </div>


    <!------------------>
    <!-- Outputs -->
    <div v-if="group.surplus && Object.keys(group.surplus).length > 0" style="margin-top: 15px; border-top: 1px solid #ccc">
      <h2>Outputs</h2>
      <div v-for="(surplusAmount, part) in group.surplus" :key="part" style="text-align: left">
        <p>{{ getPartDisplayName(part) }} Surplus: {{ surplusAmount }}/min</p>
        <label>
          <input type="radio" v-model="group.surplusHandling[part]" value="export" @change="updateGroup(group)" />
          Export
        </label>
        <label>
          <input type="radio" v-model="group.surplusHandling[part]" value="sink" @change="updateGroup(group)" />
          Sink (delete)
        </label>
      </div>
    </div>

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
    autocompleteItems() {
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
    getRecipesForPartAutoselectFormatted(part: string) {
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
        id: this.groups.length,
        name: '',
        products: [],
        inputs: [],
        partsRequired: {},
        inputsSatisfied: false,
        rawResources: [],
        surplus: {},
        surplusHandling: {},
      });
    },
    clearGroup(groupIndex: number) {
      this.groups.splice(groupIndex, 1);
      this.updateWorldRawResources();

      // When a group is cleared, we need to trigger updates to all groups to ensure consistency.
      this.groups.forEach(group => this.updateGroup(group));
    },
    // Gets the products of another group for dependencies
    getGroupOutputs(groupId: number | undefined): string[] {
      if (groupId !== 0 && !groupId) {
        console.error('Tried to get products for an undefined group ID.');
        return [];
      }
      const group = this.groups[groupId];

      if (!group) {
        console.error('Tried to get products for a group that does not exist:', groupId);
        return [];
      }
      return group.products
        .map(output => output.id)
        .filter(output => !!output);
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

<style scoped>
.group {
  border: 1px solid #28a745;
  padding: 15px 10px;
  margin: 15px 0;
}
.recipe-entry {
  margin-top: 5px;
}
.input-entry {
  margin-top: 5px;
}
</style>
