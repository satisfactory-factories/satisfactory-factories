<template>
  <h1 v-if="loading" class="text-center">Loading share data...</h1>
  <v-dialog v-model="dialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="headline">Load data?</v-card-title>
      <v-card-text>
        <p class="mb-2"><b>Careful!</b> You are about to load data from a share link. This will overwrite your current plan data!</p>
        <p class="mb-2">If you wish to save your factory data before you load this, dismiss this prompt, create your own share link and save that link first.</p>
        <p>Do you wish to continue loading the data?</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="red" @click="cancelLoad">No</v-btn>
        <v-btn color="green" @click="continueWithLoad">Yes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import { DataInterface } from '@/interfaces/DataInterface'
  import { useGameDataStore } from '@/stores/game-data-store'
  import { Factory } from '@/interfaces/planner/FactoryInterface'
  import { config } from '@/config/config'
  import { ShareDataReturnResponse } from '@/interfaces/ShareDataInterface'
  import { useAppStore } from '@/stores/app-store'
  import { useRoute } from 'vue-router'
  import router from '@/router'

  const data = ref<DataInterface | null>({} as DataInterface)

  // The route guard ensures that the game data is always loaded by the time it gets here.
  const gameDataStore = useGameDataStore()
  data.value = gameDataStore.getGameData()

  const appStore = useAppStore()
  const route = useRoute()

  const dialog = ref(false)
  const loading = ref(true)
  const loadedFactoryData = ref() // The data from the share link

  // On page load, check if there is a share ID in the URL and load the data if there is
  onMounted(() => {
    loadShareData()
  })

  const loadShareData = async () => {
    const shareId = (route.params as { id: string }).id

    if (shareId) {
      loadedFactoryData.value = await getDataFromShare(shareId)
      loading.value = false

      console.log('appStore', appStore.factories)

      if (appStore.factories.length > 0) {
        dialog.value = true
      } else {
        continueWithLoad()
      }
    }
  }

  const getDataFromShare = async (shareId: string): Promise<Factory[] | undefined> => {
    const apiUrl = config.apiUrl

    // Make an API call to get the game data from the share ID
    try {
      const response = await fetch(`${apiUrl}/share/${shareId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data: ShareDataReturnResponse = await response.json()
      if (response.ok) {
        console.log('Data:', data)
        loading.value = false

        if (data.data.length === 0) {
          alert('Failed to load share link, it contained invalid data.')
          return
        }
        return data.data
      } else {
        console.error('Loading share data failed:', data)
        alert(`Failed to load share link. Please report this error to GitHub! "${data}" `)
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error)
        alert(`Failed to load share link. Please report this error to GitHub! "${error.message}"`)
      }
    }

    return []
  }

  const continueWithLoad = () => {
    appStore.setFactories(loadedFactoryData.value)

    // Redirect user to the index
    router.push('/')
  }

  const cancelLoad = () => {
    router.push('/')
  }

</script>
