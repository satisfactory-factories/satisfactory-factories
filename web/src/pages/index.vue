<template>
  <v-card v-if="loading">
    <v-card-title class="loading-screen">
      Loading all the things...
    </v-card-title>
  </v-card>
  <planner v-if="!loading" :game-data="data" />
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import Planner from '@/components/planner/Planner.vue'
  import { DataInterface } from '@/interfaces/DataInterface'
  import { useGameDataStore } from '@/stores/game-data-store'

  // State variables
  const loading = ref(true)
  const data = ref<DataInterface>({} as DataInterface)

  async function initializeApp () {
    const gameDataStore = useGameDataStore()

    // Load game data before continuing with the rest of the app
    await gameDataStore.loadGameData()

    // Now you can safely access gameData
    data.value = gameDataStore.getGameData()
    console.log('Loaded game data:', data.value)
    loading.value = false
  }

  // Use `onMounted` to initialize the app once the component is mounted
  onMounted(async () => {
    await initializeApp()
  })
</script>

<style>
.loading-screen {
  font-size: 24px;
  text-align: center;
  margin-top: 50px;
}
</style>
