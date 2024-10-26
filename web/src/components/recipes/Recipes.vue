<template>
  <v-card>
    <recipe-search v-if="data.recipes" :recipes="data.recipes" />
  </v-card>
</template>

<script setup lang="ts">
  import { defineProps } from 'vue'
  import RecipeSearch from '@/components/RecipeSearch.vue'
  import { DataInterface } from '@/interfaces/DataInterface'

  const props = defineProps<{ gameData: DataInterface | null }>()

  if (props.gameData === null) {
    throw new Error('No game data provided to Planner!')
  }

  const data = props.gameData
</script>
