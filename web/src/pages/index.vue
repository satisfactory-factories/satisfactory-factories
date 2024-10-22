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
<script lang="ts">
  import { defineComponent } from 'vue'
  import Planner from '@/components/planner/Planner.vue'
  import { DataInterface } from '@/interfaces/DataInterface'

  export default defineComponent({
    name: 'App',
    components: {
      Planner,
    },
    data () {
      return {
        loading: true,
        data: {} as DataInterface,
        error: null as string | null,
        showRecipeList: false,
      }
    },
    async mounted () {
      // Load the game data from localStorage if it exists
      if (localStorage.getItem('gameData')) {
        this.data = JSON.parse(localStorage.getItem('gameData') as string)
        this.loading = false
        return
      }

      try {
        console.log('Game data not found in localStorage, fetching from server')
        const response = await fetch('/gameData.json')
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data: DataInterface = await response.json()

        if (!data) {
          throw new Error('No data received!')
        }

        this.data = data
        localStorage.setItem('gameData', JSON.stringify(data))
      } catch (error) {
        console.error('Error loading recipes:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.loading = false
      }
    },
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
