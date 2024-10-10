<template>
  <v-card>
    <recipe-search v-if="data.recipes" :recipes="data.recipes" />
  </v-card>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import RecipeSearch from "@/components/RecipeSearch.vue";
import {DataInterface} from "@/interfaces/DataInterface";

export default defineComponent({
  name: 'Recipes',
  components: {
    RecipeSearch,
  },
  data() {
    return {
      loading: true,
      data: {} as DataInterface,
      error: null as string | null,
    };
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
