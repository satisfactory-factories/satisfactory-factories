<template>
  <v-btn
    color="blue rounded"
    :disabled="creating"
    icon="fas fa-share-alt"
    size="small"
    variant="flat"
    @click="createShareLink"
  />
  <v-snackbar v-model="toast" color="success" top>
    Link copied to clipboard!
  </v-snackbar>
</template>

<script setup lang="ts">
  import { config } from '@/config/config'
  import { storeToRefs } from 'pinia'
  import { useAppStore } from '@/stores/app-store'
  import { useAuthStore } from '@/stores/auth-store'
  import { FactoryTab } from '@/interfaces/planner/FactoryInterface'
  import { ShareDataCreationResponse } from '@/interfaces/ShareDataInterface'

  // Get user auth stuff from the app store
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const { currentFactoryTab } = storeToRefs(appStore)

  const apiUrl = config.apiUrl
  const toast = ref(false)
  const creating = ref(false)

  const createShareLink = async () => {
    if (!currentFactoryTab.value.factories || currentFactoryTab.value.factories.length === 0) {
      alert('No factory data to share!')
      return
    }

    await handleCreation(currentFactoryTab.value)
  }

  const handleCreation = async (factoryTabData: FactoryTab) => {
    creating.value = true
    let token: string
    try {
      token = await authStore.getToken()
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error)
        alert('Your session has expired, please log in and try sharing again.')
      }
      return
    }

    try {
      const response = await fetch(`${apiUrl}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(factoryTabData),
      })
      if (response.ok) {
        const data: ShareDataCreationResponse = await response.json()
        await navigator.clipboard.writeText(`${window.location.origin}/share/${data.shareId}`)
        toast.value = true // Shows toast
        creating.value = false
      } else if (response.status === 429) {
        alert('You are being rate limited. Stop spamming that button! Please wait some time before trying again.')
      } else if (response.status === 500) {
        alert('A server error has occurred trying to create the share link. Please report this on Discord!')
      } else if (response.status === 502) {
        alert('The backend server is offline! Please report this with some urgency on Discord!')
      } else {
        console.error('Creating share link failed:', response.body)
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
