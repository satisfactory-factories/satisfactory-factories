<template>
  <v-container>
    <v-app-bar-title>Factory Planner</v-app-bar-title>
    <v-card-title v-if="loading" class="loading-screen">
      Loading all the things...
    </v-card-title>
    <v-card-title v-else-if="error" class="error-screen">
      Error loading recipes: {{ error }}
    </v-card-title>
    <v-card v-else>
      <planner v-if="data.items" :data="data"></planner>
    </v-card>
    <v-card>
      <v-card-title>Available Recipes</v-card-title>
      <v-btn @click="toggleRecipeList">{{ showRecipeList ? 'Hide' : 'Show' }} Recipe List</v-btn>
      <recipe-search v-if="data.recipes && showRecipeList" :recipes="data.recipes" />
    </v-card>
  </v-container>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import RecipeSearch from '@/components/RecipeSearch.vue';
import Planner from "@/components/Planner.vue";
import {DataInterface} from "@/interfaces/DataInterface";

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
