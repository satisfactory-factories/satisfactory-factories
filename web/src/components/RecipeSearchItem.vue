<template>
  <v-expansion-panel
    :title="recipe.displayName"
  >
    <v-expansion-panel-text>
      <recipe-item :recipe="recipe" />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import RecipeItem from './RecipeItem.vue';
import {Recipe} from "@/interfaces/Recipe";


export default defineComponent({
  name: 'RecipeSearchItem',
  components: {
    RecipeItem,
  },
  props: {
    recipe: {
      type: Object as PropType<Recipe>,
      required: true,
    },
  },
});
</script>
