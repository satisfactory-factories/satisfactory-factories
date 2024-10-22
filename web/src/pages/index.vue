<template>
  <v-card>
    <v-card-title v-if="loading" class="loading-screen">
      Loading all the things...
    </v-card-title>
    <v-card-title v-else-if="error" class="error-screen">
      Error loading recipes: {{ error }}
    </v-card-title>
  </v-card>
  <planner v-if="data.items" :game-data="data" />
</template>
<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import Planner from '@/components/planner/Planner.vue'
  import { DataInterface } from '@/interfaces/DataInterface'
  import { config } from '@/config/config'

  // State variables
  const loading = ref(true)
  const data = ref<DataInterface>({} as DataInterface)
  const error = ref<string | null>(null)

  // Function to load game data
  const loadGameData = async () => {
    const dataVersion = config.dataVersion
    const localDataVersion = localStorage.getItem('gameDataVersion')

    // Load the game data from localStorage if it exists
    if (localDataVersion === dataVersion && localStorage.getItem('gameData')) {
      data.value = JSON.parse(localStorage.getItem('gameData') as string)
      loading.value = false
      return
    }

    try {
      console.log('Game data not found in localStorage, fetching from server')
      const response = await fetch(`/gameData_v${config.dataVersion}.json`)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const fetchedData: DataInterface = await response.json()

      if (!fetchedData) {
        throw new Error('No data received!')
      }

      data.value = fetchedData
      localStorage.setItem('gameData', JSON.stringify(fetchedData))
      localStorage.setItem('gameDataVersion', config.dataVersion)
    } catch (err) {
      console.error('Error loading recipes:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  // Lifecycle hook to load data when the component is mounted
  onMounted(() => {
    loadGameData()
  })
</script>

<style>
.loading-screen {
  font-size: 24px;
  text-align: center;
  margin-top: 50px;
}

.error-screen {
  font-size: 24px;
  text-align: center;
  margin-top: 50px;
  color: red;
}
</style>
