<template>
  <v-btn
    class="ml-2"
    color="blue"
    :disabled="creating"
    variant="flat"
    @click="createShareLink"
  >
    <i class="fas fa-share-alt" /><span class="ml-2">Share Plan</span>
  </v-btn>

  <v-snackbar v-model="toast" color="success" top>
    Link copied to clipboard!
  </v-snackbar>
</template>

<script setup lang="ts">
  import { config } from '@/config/config'
  import { storeToRefs } from 'pinia'
  import { useAppStore } from '@/stores/app-store'
  import { Factory } from '@/interfaces/planner/FactoryInterface'
  import { ShareDataCreationResponse } from '@/interfaces/ShareDataInterface'

  // Get user auth stuff from the app store
  const appStore = useAppStore()
  const { token, factories } = storeToRefs(appStore)

  const apiUrl = config.apiUrl
  const toast = ref(false)
  const creating = ref(false)

  const createShareLink = async () => {
    if (!factories.value || factories.value.length === 0) {
      alert('No factory data to share!')
      return
    }

    await handleCreation(factories.value)
  }

  const handleCreation = async (factoryData: Factory[]) => {
    creating.value = true
    try {
      const response = await fetch(`${apiUrl}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`,
        },
        body: JSON.stringify(factoryData),
      })
      if (response.ok) {
        const data: ShareDataCreationResponse = await response.json()
        await navigator.clipboard.writeText(`${window.location.origin}/share/${data.shareId}`)
        toast.value = true // Shows toast
        creating.value = false
      } else if (response.status === 429) {
        alert('You are being rate limited. Stop spamming that button! Please wait some time before trying again.')
      } else {
        console.error('Creating share link failed failed:', response.body)
        alert(`Failed to create share link. Please report this error on our GitHub site 'https://github.com/satisfactory-factories/application'! "${response.body}"`)
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error)
        alert(`Failed to create share link. Please report this error on our GitHub site 'https://github.com/satisfactory-factories/application'! "${error}"`)
      }
    }
  }
</script>
