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
  <v-dialog v-model="showCopyDialog" max-width="600">
    <v-card>
      <v-card-title>Copy the link below</v-card-title>
      <v-card-text>
        <p class="mb-4">Annoyingly your device / browser doesn't support copying to clipboard automatically. Please copy the link below manually.</p>
        <v-text-field v-model="link" readonly />
        <div class="text-center">
          <v-btn color="green" variant="flat" @click="copyLink(link)"><i class="fas fa-copy mr-2" />Copy</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
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
  const link = ref()
  const showCopyDialog = ref(false)

  const createShareLink = async () => {
    if (!currentFactoryTab.value.factories || currentFactoryTab.value.factories.length === 0) {
      alert('No factory data to share!')
      return
    }

    creating.value = true
    link.value = await handleCreation(currentFactoryTab.value) ?? ''
    creating.value = false

    // If no link was returned assume server errors
    if (!link.value) {
      return
    }

    console.log('ShareButton: Link created', link.value)

    try {
      await copyLink(link.value)
    } catch (err) {
      if (err instanceof Error && err.message.includes('not allowed by the user agent')) {
        console.error('Failed to copy link to clipboard, showing share dialog', err)
        showCopyDialog.value = true
      }
    }
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
        return `${window.location.origin}/share/${data.shareId}`
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

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url)
    toast.value = true
    showCopyDialog.value = false
  }
</script>
