<template>
  <div id="planner">
    <h1>Factory Planner</h1>
    <button @click="createGroup">Create New Group</button>
    <div v-for="(group, index) in groups" :key="index" class="group">
      <h3>Group {{ index + 1 }}</h3>
      <label>
        Group Name:
        <input type="text" v-model="group.name" />
      </label>
      <div>
        <button @click="addRecipeToGroup(index)">Add Recipe</button>
        <div v-for="(recipe, recipeIndex) in group.recipes" :key="recipeIndex" class="recipe-entry">
          <label>
            Recipe:
            <select v-model="recipe.id" @change="calculateWorldResources">
              <option v-for="recipeOption in recipes" :key="recipeOption.id" :value="recipeOption.id">
                {{ recipeOption.displayName }}
              </option>
            </select>
          </label>
          <label>
            Amount (/min):
            <input type="number" v-model.number="recipe.amountPerMinute" @input="calculateWorldResources" />
          </label>
        </div>
      </div>
      <div>
        <button @click="addInputToGroup(index)">Add Input</button>
        <div v-for="(input, inputIndex) in group.inputs" :key="inputIndex" class="input-entry">
          <label>
            Input Source:
            <select v-model="input.sourceType">
              <option value="world">World</option>
              <option value="group">Group</option>
            </select>
          </label>
          <div v-if="input.sourceType === 'world'">
            <label>
              Resource:
              <select v-model="input.resource">
                <option v-for="ore in worldResources" :key="ore" :value="ore">
                  {{ ore }}
                </option>
              </select>
            </label>
            <label>
              Amount (/min):
              <input type="number" v-model.number="input.amountPerMinute" />
            </label>
          </div>
          <div v-else-if="input.sourceType === 'group'">
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
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Recipe } from '../interfaces/Recipe';

interface Group {
  name: string;
  recipes: Array<{
    id: string;
    amountPerMinute: number;
  }>;
  inputs: Array<{
    sourceType: 'world' | 'group';
    resource?: string;
    groupId?: number;
    outputResource?: string;
    amountPerMinute: number;
  }>;
}

export default defineComponent({
  name: 'Planner',
  props: {
    recipes: {
      type: Array as () => Recipe[],
      required: true,
    },
  },
  data() {
    return {
      groups: JSON.parse(localStorage.getItem('factoryGroups') || '[]') as Group[],
      worldResources: [] as string[],
    };
  },
  watch: {
    groups: {
      handler() {
        localStorage.setItem('factoryGroups', JSON.stringify(this.groups));
      },
      deep: true,
    },
  },
  created() {
    this.extractWorldResources();
  },
  methods: {
    createGroup() {
      this.groups.push({
        name: '',
        recipes: [],
        inputs: [],
      });
    },
    addRecipeToGroup(groupIndex: number) {
      this.groups[groupIndex].recipes.push({
        id: '',
        amountPerMinute: 0,
      });
    },
    addInputToGroup(groupIndex: number) {
      this.groups[groupIndex].inputs.push({
        sourceType: 'world',
        amountPerMinute: 0,
      });
    },
    getGroupOutputs(groupId: number): string[] {
      const group = this.groups[groupId];
      return group.recipes
        .map(recipe => {
          const recipeData = this.recipes.find(r => r.id === recipe.id);
          return recipeData ? Object.keys(recipeData.product)[0] : '';
        })
        .filter(output => output);
    },
    calculateWorldResources() {
      console.log('Calculating world resources...');
      this.groups.forEach(group => {
        group.inputs = group.inputs.filter(input => input.sourceType !== 'world');

        group.recipes.forEach(recipeEntry => {
          const recipe = this.recipes.find(r => r.id === recipeEntry.id);
          if (recipe) {
            Object.entries(recipe.ingredients).forEach(([ingredient, amount]) => {
              if (this.worldResources.includes(ingredient)) {
                const existingInput = group.inputs.find(
                  input => input.sourceType === 'world' && input.resource === ingredient
                );
                if (existingInput) {
                  existingInput.amountPerMinute += amount * recipeEntry.amountPerMinute;
                } else {
                  group.inputs.push({
                    sourceType: 'world',
                    resource: ingredient,
                    amountPerMinute: amount * recipeEntry.amountPerMinute,
                  });
                }
              }
            });
          }
        });
      });
      console.log('Groups after calculating world resources:', JSON.stringify(this.groups, null, 2));
    },
    extractWorldResources() {
      console.log('Extracting world resources...');
      const ores = new Set<string>();
      this.recipes.forEach(recipe => {
        Object.keys(recipe.ingredients).forEach(ingredient => {
          if (ingredient.toLowerCase().includes('ore')) {
            ores.add(ingredient);
          }
        });
      });
      this.worldResources = Array.from(ores);
      console.log('Extracted world resources:', this.worldResources);
    },
  },
});
</script>

<style scoped>
.group {
  border: 1px solid #28a745;
  padding: 10px;
  margin-bottom: 15px;
}
.recipe-entry {
  margin-top: 10px;
}
.input-entry {
  margin-top: 10px;
}
</style>