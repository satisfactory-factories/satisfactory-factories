<template>
  <div>
    <input type="text" v-model="searchTerm" placeholder="Search recipes..." />
    <label>
      <input type="checkbox" v-model="showAltRecipes" /> Show Alt. Recipes
    </label>
    <ul>
      <recipe-search-item v-for="recipe in filteredRecipes" :key="recipe.id" :recipe="recipe" />
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RecipeSearchItem from './RecipeSearchItem.vue';
import { Recipe } from '../interfaces/Recipe';

export default defineComponent({
  name: 'RecipeSearch',
  components: {
    RecipeSearchItem,
  },
  props: {
    recipes: {
      type: Array as () => Recipe[],
      required: true,
    },
  },
  data() {
    return {
      searchTerm: '' as string,
      showAltRecipes: false,
    };
  },
  computed: {
    filteredRecipes(): Recipe[] {
      let filtered = this.recipes;
      if (this.searchTerm) {
        filtered = filtered.filter(recipe =>
          recipe.displayName.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }
      if (!this.showAltRecipes) {
        filtered = filtered.filter(recipe => !recipe.isAlternate);
      }
      return filtered;
    },
  },
});
</script>

<style scoped>
ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 10px;
}
</style>