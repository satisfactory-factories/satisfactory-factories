<template>
  <div>
      <b>Inputs:</b>
      <ul>
        <li v-for="ingredient in recipe.ingredients" :key="Object.keys(ingredient)[0]">
          {{ Object.keys(ingredient)[0] }}: {{ Object.values(ingredient)[0] }}
        </li>
      </ul>
      <b>Outputs:</b>
      <ul>
        <li>
          {{ Object.keys(recipe.product)[0] }}: {{ Object.values(recipe.product)[0] }} /  {{ recipe.perMin }}/min
        </li>
      </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import {Recipe} from "../interfaces/Recipe.ts";

export default defineComponent({
  name: 'RecipeItem',
  props: {
    recipe: {
      type: Object as PropType<Recipe>,
      required: true,
    },
  },
});
</script>

<style scoped>
div {
  text-align: left;

  h3 {
    text-align: center;
    margin: 0;
  }
}
</style>