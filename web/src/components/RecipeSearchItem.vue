<template>
  <div @click="toggleCollapse" class="collapsible-header">
    <span><b>{{ recipe.displayName }}</b></span>
    <span v-if="collapsed"> [+]</span>
    <span v-else> [-]</span>
  </div>
  <div v-if="!collapsed" class="collapsible-content">
    <recipe-item :recipe="recipe" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import RecipeItem from './RecipeItem.vue';
import {Recipe} from "../interfaces/Recipe.ts";


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
  data() {
    return {
      collapsed: true,
    };
  },
  methods: {
    toggleCollapse() {
      this.collapsed = !this.collapsed;
    },
  },
});
</script>

<style scoped>
.collapsible-header {
  cursor: pointer;
  background-color: #f0f0f0;
  padding: 10px;
  margin: 5px 0;
  border-radius: 4px;
}
.collapsible-content {
  padding-left: 20px;
  margin-bottom: 10px;
}
</style>