<template>
  <div id="planner">
    <h1>Factory Planner</h1>

    <h2>World ores available</h2>
    <div v-for="ore in worldResources" :key=ore>{{ ore }}</div>

    <button @click="createGroup">Create New Group</button>
    <button @click="clear" style="background-color: red">Clear (!)</button>

    <div v-for="(group, index) in groups" :key="index" class="group">
      <h3>Group {{ index + 1 }}</h3>
      <label>
        Group Name:
        <input type="text" v-model="group.name" />
      </label>
      <div>
        <button @click="clearGroup(group.id)" style="background-color: red">Delete Group (!)</button>
        <button @click="addRecipeToGroup(index)">Add Output</button>
        <div v-for="(recipe, recipeIndex) in group.recipes" :key="recipeIndex" class="recipe-entry">
          <label>
            Item:
            <select v-model="recipe.id" @change="updateGroup(group)">
              <option v-for="recipeOption in data.recipes" :key="recipeOption.id" :value="recipeOption.id">
                {{ recipeOption.displayName }}
              </option>
            </select>
          </label>
          <label>
            /min:
            <input type="number" v-model.number="recipe.amountPerMinute" @input="updateGroup(group)" />
          </label>
        </div>
      </div>
      <div>
        <button :disabled="groups.length < 2" @click="addInputToGroup(index)">Add Input Group <span v-if="groups.length < 2">(Add another group!)</span></button>
        <div v-for="(inputIndex) in group.rawResources" :key="inputIndex" class="input-entry">
          <div v-if="group.rawResources.length > 0">
            <p>Raw Resources:</p>
            <div v-for="(resource, resourceIndex) in group.rawResources" :key="resourceIndex">
              <p>{{ resource.name }}: {{ resource.amount }}/m</p>
            </div>
          </div>
        </div>
        <div v-for="(input, inputIndex) in group.inputs" :key="inputIndex" class="input-entry">
          <label>
            Group:
            <select v-model="input.groupId">
              <option v-for="(otherGroup, otherIndex) in groups" :key="otherIndex" :value="otherIndex" :disabled="otherIndex === index">
                Group {{ otherIndex + 1 }} - {{ otherGroup.name }}
              </option>
            </select>
          </label>
          <label>
            Output:
            <select v-model="input.outputResource">
              <option v-for="output in getGroupOutputs(input.groupId)" :key="output" :value="output">
                {{ output }}
              </option>
            </select>
          </label>
          <label>
            Amount (/min):
            <input type="number" v-model.number="input.amountPerMinute" />
          </label>
        </div>
      </div>
    <pre style="text-align: left">{{ JSON.stringify(group, null, 2) }}</pre>    </div>
  </div>
      <pre style="text-align: left">{{ JSON.stringify(this.groups, null, 2) }}</pre>

</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {DataInterface} from "../interfaces/DataInterface.ts";

interface Group {
  id: number;
  name: string;
  recipes: Array<{
    id: string;
    amountPerMinute: number;
  }>;
  inputs: Array<{
    resource?: string;
    groupId?: number;
    outputResource?: string;
    amountPerMinute: number;
    // Holds the resources required to fulfil the inputs.
  }>;
  partsRequired: { [key: string]: number };
  rawResources: Array<{
    name: string;
    amount: number;
  }>;
}

export interface WorldResource {
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
      worldResources: {} as Map<string, WorldResource>
    }
  },
  created() {
    this.generateRawResources();
    this.calculateRemainingRawResources();
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
        recipes: [],
        inputs: [],
        partsRequired: new Map<string, number>(),
        rawResources: [],
      });
    },
    clear() {
      this.groups = [];
    },
    clearGroup(groupIndex: number) {
      this.groups.splice(groupIndex, 1);
    },
    addRecipeToGroup(groupIndex: number) {
      this.groups[groupIndex].recipes.push({
        id: '',
        amountPerMinute: 0,
      });
    },
    addInputToGroup(groupIndex: number) {
      this.groups[groupIndex].inputs.push({
        groupId: 0,
        amountPerMinute: 0,
      });
    },
    getGroupOutputs(groupId: number | undefined): string[] {
      if (!groupId) {
        return [];
      }
      const group = this.groups[groupId];

      if (!group) {
        console.error('Tried to get outputs for a group that does not exist:', groupId);
        return [];
      }
      return group.recipes
        .map(recipe => {
          const recipeData = this.data.recipes.find(r => r.id === recipe.id);
          return recipeData ? Object.keys(recipeData.product)[0] : '';
        })
        .filter(output => output);
    },

    updateGroup(group: Group) {
      this.calculateRemainingRawResources();
      this.updateGroupRequirements(group);
    },
    // This function calculates the world resources available after each group has consumed Raw Resources.
    calculateRemainingRawResources() {
      // Generate fresh world resources as a baseline for calculation.
      this.generateRawResources();

      console.log('Calculating raw resource usage for groups...');

      // Loop through each group to calculate inputs.
      this.groups.forEach(group => {
        // Filter out previous 'world' inputs before recalculating.
        group.inputs = group.inputs.filter(input => input.sourceType !== 'world');

        group.recipes.forEach(recipeEntry => {
          const recipe = this.data.recipes.find(r => r.id === recipeEntry.id);
          if (!recipe) {
            console.warn(`Recipe with ID ${recipeEntry.id} not found.`);
            return;
          }

          // Loop through each ingredient in the recipe (array of objects).
          recipe.ingredients.forEach(ingredientObject => {
            // Extract the ingredient name and amount.
            const [ingredientKey, ingredientAmount] = Object.entries(ingredientObject)[0];

            if (isNaN(ingredientAmount)) {
              console.warn(`Invalid ingredient amount for ingredient ${ingredientKey}. Skipping.`);
              return;
            }

            if (this.worldResources.has(ingredientKey)) {
              const resource = this.worldResources.get(ingredientKey);

              if (!resource) {
                console.warn(`World resource for ingredient ${ingredientKey} not found.`);
                return;
              }

              // Update the world resource by reducing the available amount.
              const updatedAmount = resource.amount - (ingredientAmount * recipeEntry.amountPerMinute);
              this.worldResources.set(ingredientKey, {
                name: resource.name,
                amount: updatedAmount,
              });
            }
          });
        });
      });
      console.log('Groups after calculating world resources:', JSON.stringify(this.groups, null, 2));
    },
    generateRawResources() {
      if (this.worldResources.size > 0) this.worldResources.clear();

      console.log('Setting up world resources...');
      const ores = new Map<string, WorldResource>();

      console.log(this.data.items.rawResources);
      Object.keys(this.data.items.rawResources).forEach((name) => {
        const resource = this.data.items.rawResources[name];
        ores.set(name, {
          name: resource.name,
          amount: resource.limit,
        })
      });

      this.worldResources = ores;
      console.log('World resources:', this.worldResources);
    },

    updateGroupRequirements(group: Group) {
      console.log('Resolving input requirements for group:', group);

      // First blow away the current requirements so we don't get addative results.
      group.partsRequired = {};

      // First loop the recipes of the group to get the total number of parts we want to build.
      group.recipes.forEach(recipe => {
        const recipeData = this.data.recipes.find(r => r.id === recipe.id);
        if (!recipeData) {
          console.warn(`Recipe with ID ${recipe.id} not found.`);
          return;
        }

        console.log('Recipe data:', recipeData);

        // Loop through each ingredient in the recipe (array of objects).
        recipeData.ingredients.forEach(ingredientObject => {
          // Extract the ingredient name and amount.
          const [ingredientKey, ingredientAmount] = Object.entries(ingredientObject)[0];

          console.log('Looking at part', ingredientKey, 'with amount', ingredientAmount);

          if (isNaN(ingredientAmount)) {
            console.warn(`Invalid ingredient amount for ingredient ${ingredientKey}. Skipping.`);
            return;
          }

          // Update the group's input to reflect world resource usage.
          // Use a plain object for partsRequired to ensure Vue reactivity.
          if (!group.partsRequired) {
            group.partsRequired = {};
          }

          const existingPartAmount = group.partsRequired[ingredientKey] || 0;
          const newAmount = ingredientAmount * recipe.amountPerMinute + existingPartAmount;

          // Update partsRequired with the new amount.
          group.partsRequired = {
            ...group.partsRequired,
            [ingredientKey]: newAmount,
          };

          console.log('Updated group partsRequired:', group.partsRequired);
        });
      });
    }
  },
});
</script>

<style scoped>
.group {
  border: 1px solid #28a745;
  padding: 10px;
  margin: 10px 0;
}
.recipe-entry {
  margin-top: 10px;
}
.input-entry {
  margin-top: 10px;
}
</style>