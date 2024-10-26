<template>
  <v-card title="Recipes">
    <v-divider />
    <v-card-text>
      <v-text-field v-model="searchTerm" label="Recipe name" />
      <v-chip color="primary" :variant="showAltRecipes ? 'flat' : 'outlined'" @click="toggleAltRecipes">
        Alt Recipes
      </v-chip>
      <v-expansion-panels multiple>
        <recipe-search-item v-for="recipe in filteredRecipes" :key="recipe.id" :recipe="recipe" />
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import RecipeSearchItem from './RecipeSearchItem.vue'
  import { Recipe } from '@/interfaces/Recipe'

  // Props
  const props = defineProps<{
    recipes: Recipe[];
  }>()

  // Reactive State
  const searchTerm = ref<string>('')
  const showAltRecipes = ref<boolean>(false)

  // Computed Property
  const filteredRecipes = computed<Recipe[]>(() => {
    let filtered = props.recipes

    if (searchTerm.value) {
      filtered = filtered.filter(recipe =>
        recipe.displayName.toLowerCase().includes(searchTerm.value.toLowerCase())
      )
    }

    if (!showAltRecipes.value) {
      filtered = filtered.filter(recipe => !recipe.isAlternate)
    }

    return filtered
  })

  // Methods
  const toggleAltRecipes = () => {
    showAltRecipes.value = !showAltRecipes.value
  }
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
