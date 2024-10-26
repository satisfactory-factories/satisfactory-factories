<template>
  <v-expansion-panel
    :title="recipe.displayName"
  >
    <v-expansion-panel-text>
      <recipe-item :recipe="recipe" />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup lang="ts">
  import RecipeItem from './RecipeItem.vue'
  import { Recipe } from '@/interfaces/Recipe'

  const props = defineProps<{
    recipe: Recipe;
  }>()
</script>
