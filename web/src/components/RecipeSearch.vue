<template>
  <v-card title="Recipes">
    <v-divider />
    <v-card-text>
      <v-text-field v-model="searchTerm" label="Recipe name" />
      <v-chip color="primary" :variant="showAltRecipes ? 'flat' : 'outlined'" @click="toggleAltRecipes">Alt Recipes</v-chip>
      <v-expansion-panels multiple>
        <recipe-search-item v-for="recipe in filteredRecipes" :key="recipe.id" :recipe="recipe" />
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  import RecipeSearchItem from './RecipeSearchItem.vue'
  import { Recipe } from '@/interfaces/Recipe'

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
    data () {
      return {
        searchTerm: '' as string,
        showAltRecipes: false,
      }
    },
    computed: {
      filteredRecipes (): Recipe[] {
        let filtered = this.recipes
        if (this.searchTerm) {
          filtered = filtered.filter(recipe =>
            recipe.displayName.toLowerCase().includes(this.searchTerm.toLowerCase())
          )
        }
        if (!this.showAltRecipes) {
          filtered = filtered.filter(recipe => !recipe.isAlternate)
        }
        return filtered
      },
    },
    methods: {
      toggleAltRecipes () {
        this.showAltRecipes = !this.showAltRecipes
      },
    },
  })
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
