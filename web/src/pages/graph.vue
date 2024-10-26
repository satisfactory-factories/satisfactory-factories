<template>
  <graph :game-data="data" />
</template>

<script setup lang="ts">
  import Graph from '@/components/graph/Graph.vue'
  import { ref } from 'vue'
  import { DataInterface } from '@/interfaces/DataInterface'
  import { useGameDataStore } from '@/stores/game-data-store'

  const data = ref<DataInterface | null>({} as DataInterface)

  // The route guard ensures that the game data is always loaded by the time it gets here.
  const gameDataStore = useGameDataStore()
  data.value = gameDataStore.getGameData()
</script>
