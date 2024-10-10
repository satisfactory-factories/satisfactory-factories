<template>
  <div id="planner">
    <h1>Factory Planner</h1>

<!--    <h2>World ores available</h2>-->
<!--    <div v-for="ore in worldRawResources" :key=ore.name>{{ ore.name }}: {{ ore.amount }}</div>-->

    <div>
      <h2>Todo</h2>
      <div style="text-align: left">
        <ul>
          <li>When output is added, define the recipe used to create the item, this is required for the Satisfaction, which is then required to produce demand.</li>
          <li>Prevent demands of the same part being asked from the same factory group. E.g. Factory Group 1 asking for 2x Iron Ingots at 700 and 200 each.</li>
          <li>When a group is deleted, the dependants are not properly updated. Need to check if inputs are still valid and if not delete them.</li>
          <li>Dependencies</li>
        </ul>
      </div>
    </div>

    <button @click="createGroup">Create New Group</button>
    <button @click="clearAll" style="background-color: red">Clear (!)</button>
    <button @click="setTemplate" style="background-color: green">Template</button>

    <div v-for="(group, index) in groups" :key="index" class="group" :style="groupStyling(group)">
      <div style="margin-bottom: 15px;">
        <h3 style="margin-top: 0">Group {{ index + 1 }}</h3>
        <label>
          Group Name:
          <input type="text" v-model="group.name" />
        </label>
        <button @click="clearGroup(group.id)" style="background-color: red">Delete Group (!)</button>
      </div>

      <!------------------>
      <!-- Inputs -->
      <div style="margin-bottom: 15px; border-top: 1px solid #ccc">
        <h2>Inputs</h2>
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
              <option v-for="output in getGroupOutputs(input.groupId)" :key="output" :value="output" :disabled="output == input.groupId">
                {{ getPartDisplayName(output) }}
              </option>
            </select>
          </label>
          <label>
            <input type="number" v-model.number="input.amount" @change="updateGroup(group)" min="0" />
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
          Supply is created by adding inputs to the factory.<br>
          Raw resources (e.g. Iron Ore) don't require inputs. It is assumed you'll supply them sufficently.
        </p>
        <div v-for="(part, partIndex) in group.partsRequired" :key="partIndex" style="text-align: left">
          <p :style="isSatisfiedStyling(group, partIndex)">{{ getPartDisplayName(partIndex) }}: {{ part.amountSupplied }}/{{ part.amountNeeded }} /min</p>
        </div>
      </div>

      <!------------------>
      <!-- Outputs -->
      <div style="margin-bottom: 15px; border-top: 1px solid #ccc">
        <h2>Outputs</h2>
        <div v-for="(output, outputIndex) in group.outputs" :key="outputIndex" class="recipe-entry">
          <select v-model="output.id" @change="updateGroup(group)" style="margin-right: 5px">
            <option v-for="(part, key) in data.items.parts" :key="part" :value="key">
              {{ part }}
            </option>
          </select>
           <select v-model="output.recipe" @change="updateGroup(group)" style="margin-right: 5px">
            <option v-for="recipe in getRecipesForPart(output.id)" :key="recipe.id" :value="recipe.id">
              {{ recipe.displayName }}
            </option>
          </select>
          <label>
            <input type="number" v-model.number="output.amount" @input="updateGroup(group)" min="1" />
            /min
          </label>
          <button @click="deleteOutput(outputIndex, group)" style="background-color: red">Del</button>
        </div>
        <button @click="addEmptyOutput(index)" style="background-color: dodgerblue">+</button>
      </div>

      <!------------------>
      <!-- Dependencies -->
      <div v-if="getGroupDependencies(group).demandedBy">
        <h2>Demands</h2>
        <planner-demands :dependency="getGroupDependencies(group)" :groups="groups" :data="data" />
      </div>
    </div>


    <!-- Debugging -->
    <div>
      Groups:
        <pre style="text-align: left">{{ JSON.stringify(groups, null, 2) }}</pre>
      Dependencies:
        <pre style="text-align: left">{{ JSON.stringify(dependencies, null, 2) }}</pre>

    </div>
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
    // Holds the resources required to fulfil the inputs.
  }>;
  outputs: GroupOutput[];
  partsRequired: { [key: string]: { amount: number, amountOriginal: number, satisfied: boolean } };
  inputsSatisfied: boolean;
  rawResources: Array<{
    name: string;
    amount: number;
  }>;
}

interface GroupDependency {
  outputGroupId: number;
  inputGroupId: number;
  outputPart: string;
  outputAmount: number;
}

interface GroupOutput {
  id: string;
  recipe: string;
  amount: number;
}

export interface RawResource {
  name: string;
  amount: number;
}

import PlannerDemands from "./PlannerDemands.vue";
export default defineComponent({
  name: 'Planner',
  components: {
    PlannerDemands
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
        const groupOutputs = Object.keys(group.outputs);
        if (groupOutputs.length === 0) {
          return false
        }

        // If all group outputs are not valid, the group is not valid.
        // Validity means each output has an ID and an amount more than 0.
        return groupOutputs.every(output => group.outputs[output].id && group.outputs[output].amount > 0);
      });
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

      // Iterate through groups to build the initial dependencies with demands
      this.groups.forEach(group => {
        group.inputs.forEach(input => {
          const dependency = {
            part: input.outputPart,
            amount: input.amount,
          };

          // Create an entry for the group that is being demanded from if it doesn't exist
          if (!newDependencies[input.groupId]) {
            newDependencies[input.groupId] = {
              demandedBy: {},
              metrics: {},
            };
          }

          // Create demands array for the specific group relationship if it doesn't exist
          if (!newDependencies[input.groupId].demandedBy[group.id]) {
            newDependencies[input.groupId].demandedBy[group.id] = [];
          }

          // Add the dependency to the appropriate group
          newDependencies[input.groupId].demandedBy[group.id].push(dependency);
        });
      });

      // Now loop through the dependencies and calculate the total demand upon each part within the group
      Object.keys(newDependencies).forEach(groupDepId => {
        const groupDependency = newDependencies[groupDepId];

        Object.keys(groupDependency.demandedBy).forEach(depGroupId => {
          const depGroup = groupDependency.demandedBy[depGroupId];
          depGroup.forEach(demand => {
            const part = demand.part;

            if (!groupDependency.metrics[part]) {
              groupDependency.metrics[part] = {
                part,
                demand: 0,
                supply: 0,
                isDemandSatisfied: false,
              };
            }

            groupDependency.metrics[part].demand += demand.amount;
          });
        });

        // Calculate the supply and whether the demand is satisfied
        const thisGroup = this.groups[groupDepId];
        thisGroup.outputs.forEach(output => {
          if (groupDependency.metrics[output.id]) {
            groupDependency.metrics[output.id].supply = output.amount;
            groupDependency.metrics[output.id].isDemandSatisfied =
              output.amount >= groupDependency.metrics[output.id].demand;
          }
        });
      });

      // Replace the existing dependencies with the new ones
      this.dependencies = newDependencies;
      console.log(this.dependencies);
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

    // ==== GROUPS
    createGroup() {
      this.groups.push({
        id: this.groups.length,
        name: '',
        outputs: [],
        inputs: [],
        partsRequired: {},
        inputsSatisfied: false,
        rawResources: [],
      });
    },
    clearGroup(groupIndex: number) {
      this.groups.splice(groupIndex, 1);
      this.updateWorldRawResources();

      // When a group is cleared, we need to trigger updates to all groups to ensure consistency.
      this.groups.forEach(group => this.updateGroup(group));
    },
    // Gets the outputs of another group for dependencies
    getGroupOutputs(groupId: number | undefined): string[] {
      if (groupId !== 0 && !groupId) {
        console.error('Tried to get outputs for an undefined group ID.');
        return [];
      }
      const group = this.groups[groupId];

      if (!group) {
        console.error('Tried to get outputs for a group that does not exist:', groupId);
        return [];
      }
      return group.outputs
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

      // Loop through each group's outputs to calculate usage of raw resources.
      this.groups.forEach(group => {
        group.outputs.forEach(output => {
          const recipe = this.data.recipes.find(r => r.id === output.id);
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
      // First reset the current requirements, so we don't get additive results.
      group.partsRequired = {};

      // First loop the recipes of the group to get the total number of parts we want to build.
      group.outputs.forEach(output => {
        const recipe = this.data.recipes.find(r => r.id === output.recipe);
        if (!recipe) {
          console.error(`Recipe with ID ${output.id} not found.`);
          return;
        }

        // Loop through each ingredient in the recipe.
        recipe.ingredients.forEach(ingredientPart => {
          // Extract the ingredient name and amount.
          const [part, partAmount] = Object.entries(ingredientPart)[0];

          if (isNaN(partAmount)) {
            console.warn(`Invalid ingredient amount for ingredient ${part}. Skipping.`);
            return;
          }

          // Update the group's input of parts.
          if (!group.partsRequired[part]) {
            group.partsRequired[part] = {
              amountNeeded: 0,
              amountSupplied: 0,
              satisfied: false,
            };
          }

          const isRaw = !!this.data.items.rawResources[part];

          const existingPartAmount = group.partsRequired[part].amountNeeded || 0;

          // Update the amount required with the new amount.
          group.partsRequired[part].amountNeeded = parseInt((partAmount * output.amount) + existingPartAmount)

          // If raw, automatically mark it as satisfied and also update the supply.
          if (isRaw) {
            group.partsRequired[part].satisfied = true;
            group.partsRequired[part].amountSupplied = group.partsRequired[part].amountNeeded;
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
      console.log(`Getting dependencies for group ${group.id}`);
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

    // ==== OUTPUTS
    addEmptyOutput(groupIndex: number) {
      this.groups[groupIndex].outputs.push({
        id: '',
        amount: 0,
      });
    },

    deleteOutput(outputIndex: number, group: Group) {
      group.outputs.splice(outputIndex, 1)
      this.updateGroup(group);
    },

    setTemplate() {
      this.groups = [
        {
          "id": 0,
          "name": "Iron Ingot Fac",
          "outputs": [
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
          "outputs": [
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
          "outputs": [
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
          "outputs": [
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