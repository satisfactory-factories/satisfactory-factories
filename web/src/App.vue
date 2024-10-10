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
        <planner v-if="data.items" :data="data"></planner>
      </div>
      <h1>Available Recipes</h1>
      <button @click="toggleRecipeList">{{ showRecipeList ? 'Hide' : 'Show' }} Recipe List</button>
      <div v-if="showRecipeList">
        <recipe-search v-if="data.recipes" :recipes="data.recipes" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RecipeSearch from './components/RecipeSearch.vue';
import Planner from "./components/Planner.vue";
import {DataInterface} from "./interfaces/DataInterface.ts";

export default defineComponent({
  name: 'App',
  components: {
    RecipeSearch,
    Planner
  },
  data() {
    return {
      loading: true,
      data: {} as DataInterface,
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
      const data: DataInterface = await response.json();

      console.log(data);

      if (!data) {
        throw new Error('No data received!');
      }

      this.data = data;
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