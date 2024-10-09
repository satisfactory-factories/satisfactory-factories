<template>
  <div id="planner">
    <h1>Factory Planner</h1>

    <h2>World ores available</h2>
    <div v-for="ore in worldRawResources" :key=ore.name>{{ ore.name }}: {{ ore.amount }}</div>

    <button @click="createGroup">Create New Group</button>
    <button @click="clear" style="background-color: red">Clear (!)</button>

    <div v-for="(group, index) in groups" :key="index" class="group">
      <div style="margin-bottom: 15px;">
        <h3 style="margin-top: 0">Group {{ index + 1 }}</h3>
        <label>
          Group Name:
          <input type="text" v-model="group.name" />
        </label>
        <button @click="clearGroup(group.id)" style="background-color: red">Delete Group (!)</button>
      </div>

      <div style="margin-bottom: 15px; border-top: 1px solid #ccc">
        <h3>Inputs</h3>
        <div v-for="(inputIndex) in group.rawResources" :key="inputIndex" class="input-entry">
          <div v-if="group.rawResources.length > 0">
            <p>Raw Resources:</p>
            <div v-for="(resource, resourceIndex) in group.rawResources" :key="resourceIndex">
              <p>{{ resource.name }}: {{ resource.amount }}/m</p>
            </div>
          </div>
        </div>
        <div v-for="(input, inputIndex) in group.inputs" :key="inputIndex">
          <label>
            Group:
            <select v-model="input.groupId">
              <option v-for="(otherGroup, otherIndex) in groups"
                      :key="otherIndex"
                      :value="otherIndex"
                      @change="updateGroup(group)"
                      :disabled="otherIndex === index"
              >
                Group {{ otherIndex + 1 }} - {{ otherGroup.name }}
              </option>
            </select>
          </label>
          <label>
            Output:
            <select v-model="input.outputPart" @change="updateGroup(group)">
              <option v-for="output in getGroupOutputs(input.groupId)" :key="output" :value="output" :disabled="group.id === input.groupId">
                {{ output }}
              </option>
            </select>
          </label>
          <label>
            <input type="number" v-model.number="input.amount" @change="updateGroup(group)" min="0" />
            /min
          </label>
          <button @click="group.inputs.splice(inputIndex, 1)" style="background-color: red">Del</button>
        </div>
        <button :disabled="groups.length < 2" @click="addEmptyInput(group)">+ <span v-if="groups.length < 2">(Add another group!)</span></button>
      </div>

      <div style="margin-bottom: 15px; border-top: 1px solid #ccc">
        <h3>Requirements</h3>
        <div v-for="(part, partIndex) in group.partsRequired" :key="partIndex" style="text-align: left">
          <p :style="isSatisfiedStyling(group, partIndex)">{{ getPartDisplayName(partIndex) }}: {{ part.amountSupplied }}/{{ part.amountNeeded }} /min</p>
        </div>
      </div>

      <div style="margin-bottom: 15px; border-top: 1px solid #ccc">
        <h3>Outputs</h3>
        <div v-for="(output, outputIndex) in group.outputs" :key="outputIndex" class="recipe-entry">
          <label>
            <select v-model="output.id" @change="updateGroup(group)">
              <option v-for="recipeOption in data.recipes" :key="recipeOption.id" :value="recipeOption.id">
                {{ recipeOption.displayName }}
              </option>
            </select>
          </label>
          <label style="margin-left: 10px">
            <input type="number" v-model.number="output.amount" @input="updateGroup(group)" min="1" />
            /min
          </label>
          <button @click="deleteOutput(outputIndex, group)" style="background-color: red">Del</button>
        </div>
        <button @click="addRecipeToGroup(index)" style="background-color: dodgerblue">+</button>
      </div>
      <div v-if="group.dependants.length > 0">
        <h3>Dependants</h3>
        <div v-for="(dependant, dependantIndex) in group.dependants" :key="dependantIndex">
          <p>Group {{ dependant.groupId + 1 }} - {{ getPartDisplayName(dependant.outputPart) }}: {{ dependant.amount }}/m</p>
        </div>
      </div>
    </div>
    <pre style="text-align: left">{{ JSON.stringify(groups, null, 2) }}</pre>
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
  outputs: { [key: string]: { amount: number } };
  dependants: Array<{
    groupId: number;
    outputPart: string;
    amount: number;
  }>;
  partsRequired: { [key: string]: { amount: number, amountOriginal: number, satisfied: boolean } };
  inputsSatisfied: boolean;
  rawResources: Array<{
    name: string;
    amount: number;
  }>;

}

export interface RawResource {
  name: string;
  amount: number;
}

export default defineComponent({
  name: 'Planner',
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
    }
  },
  created() {
    this.generateRawResources();
    this.updateWorldRawResources();
  },
  watch: {
    groups: {
      handler() {
        localStorage.setItem('factoryGroups', JSON.stringify(this.groups));
      },
      deep: true,
    },
  },
  methods: {
    createGroup() {
      this.groups.push({
        id: this.groups.length,
        name: '',
        outputs: [],
        inputs: [],
        partsRequired: {},
        inputsSatisfied: false,
        rawResources: [],
        dependants: [],
      });
    },
    clear() {
      this.groups = [];
      this.updateWorldRawResources();
    },
    clearGroup(groupIndex: number) {
      this.groups.splice(groupIndex, 1);
      this.updateWorldRawResources();
    },
    isSatisfiedStyling(group: Group, requirement: string | number) {
      return group.partsRequired[requirement].satisfied ? 'color: green' : 'color: red';
    },
    getPartDisplayName(part: string | number) {
      return this.data.items.rawResources[part]?.name || this.data.items.parts[part];
    },
    addRecipeToGroup(groupIndex: number) {
      this.groups[groupIndex].outputs.push({
        id: '',
        amount: 0,
      });
    },
    addEmptyInput(group: Group) {
      group.inputs.push({
        groupId: 0,
        outputPart: '',
        amount: 0,
      });
    },
    deleteOutput(outputIndex: number, group: Group) {
      group.outputs.splice(outputIndex, 1)
      this.updateGroup(group);
    },

    // This goes through the group and calculates if it needs to add any dependencies to other groups.
    calculateGroupDependencies(group: Group) {
      for (let input of group.inputs) {
        const otherGroup = this.groups[input.groupId];

        if (!otherGroup) {
          console.warn(`Group with ID ${input.groupId} not found or was not defined yet.`);
          return;
        }

        // To prevent orphaning, delete all dependencies of the source group from the destination group.
        otherGroup.dependants = otherGroup.dependants.filter(dependant => dependant.groupId !== group.id);

        const output = otherGroup.outputs[input.outputPart];

        if (!output) {
          console.warn(`Part ${input.outputPart} not found in group ${input.groupId} or was not defined yet.`);
          return;
        }

        // Check if the dependency already exists.
        const existingDependency = group.dependants.find(dependant => dependant.groupId === input.groupId && dependant.outputPart === input.outputPart);

        if (existingDependency) {
          existingDependency.amount = input.amount;
        } else {
          otherGroup.dependants.push({
            groupId: group.groupId,
            outputPart: input.outputPart,
            amount: input.amount,
          });
        }
      }
    },

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
        .map(recipe => {
          const recipeData = this.data.recipes.find(r => r.id === recipe.id);
          return recipeData ? Object.keys(recipeData.product)[0] : '';
        })
        .filter(output => output);
    },
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

    updateGroup(group: Group) {
      this.updateWorldRawResources();
      this.updateGroupRequirements(group);
      this.checkGroupPartSatisfaction(group);
      this.calculateGroupDependencies(group);
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
              console.warn(`World resource for ingredient ${ingredientId} not found.`);
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
        const recipe = this.data.recipes.find(r => r.id === output.id);
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
        requirement.amountSupplied += group.inputs[input].amountPerMinute

        // Check if the input amount is enough to satisfy the requirement.
        const satisfied = requirement.amountSupplied >=requirement.amountNeeded;

        if (satisfied) {
         requirement.satisfied = true;
        }

        console.log('requirement', requirement)

        // If the part has 0 requirements it is technically satisfied
        if (requirement.amountNeeded == 0) {
          requirement.satisfied = true;
        }
      });

      // Now check if all requirements are satisfied.
      group.inputsSatisfied = Object.keys(group.partsRequired).every(part => group.partsRequired[part].satisfied);
    }
  },
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