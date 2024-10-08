<template>
  <div id="app">
    <div v-if="loading" class="loading-screen">
      Loading all the things...
    </div>
    <div v-else-if="error" class="error-screen">
      Error loading recipes: {{ error }}
    </div>
    <div v-else>
      <div>
        <h1>Planner</h1>
        <planner :recipes="recipes"></planner>
      </div>
      <h1>Available Recipes</h1>
      <button @click="toggleRecipeList">{{ showRecipeList ? 'Hide' : 'Show' }} Recipe List</button>
      <div v-if="showRecipeList">
        <recipe-search :recipes="recipes" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RecipeSearch from './components/RecipeSearch.vue';
import { Recipe } from './interfaces/Recipe';
import Planner from "./components/Planner.vue";

export default defineComponent({
  name: 'App',
  components: {
    RecipeSearch,
    Planner
  },
  data() {
    return {
      loading: true,
      recipes: [] as Recipe[],
      error: null as string | null,
      showRecipeList: false,
    };
  },
  methods: {
    toggleRecipeList() {
      this.showRecipeList = !this.showRecipeList;
    },
  },
  async mounted() {
    try {
      const response = await fetch('/recipes.json');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      this.recipes = data.recipes.map((recipe: Recipe) => ({
        ...recipe,
        isAlternate: recipe.isAlternate ?? false,
      }));
    } catch (error) {
      console.error('Error loading recipes:', error);
      this.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      this.loading = false;
    }
  },
});
</script>

<style>
.loading-screen {
  font-size: 24px;
  text-align: center;
  margin-top: 50px;
}

.error-screen {
  font-size: 24px;
  text-align: center;
  margin-top: 50px;
  color: red;
}
</style>