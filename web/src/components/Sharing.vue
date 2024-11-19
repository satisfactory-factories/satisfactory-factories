<template>
  <v-btn
    class="ml-2"
    color="blue"
    variant="flat"
    @click="createShareLink"
  >
    <i class="fas fa-share-alt" /><span class="ml-2">Share Plan</span>
  </v-btn>

  <v-dialog v-model="dialog" max-width="600">
    <v-card>
      <v-card-title class="headline">Share Plan</v-card-title>
      <v-card-text class="text-center">
        <v-text-field
          v-model="shareLink"
          label="Share Link"
          readonly
        />
        <v-btn v-if="!copied" color="blue darken-1" @click="copyLink">Copy</v-btn>
        <v-btn v-if="copied" color="blue darken-1" :disabled="true">Copied!</v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { config } from '@/config/config'
  import { storeToRefs } from 'pinia'
  import { useAppStore } from '@/stores/app-store'
  import { Factory } from '@/interfaces/planner/FactoryInterface'
  import { ShareDataCreationResponse } from '@/interfaces/ShareDataInterface'

  // Get user auth stuff from the app store
  const appStore = useAppStore()
  const { loggedInUser, token, factories } = storeToRefs(appStore)
  const apiUrl = config.apiUrl
  const shareId = ref('')
  const shareLink = ref('')
  const dialog = ref(false)
  const copied = ref(false)

  const createShareLink = async () => {
    if (!loggedInUser.value) {
      alert('You need to be logged in to share links.')
      return
    }
    // This shouldn't happen but just in case
    if (!token.value) {
      alert('Missing token! Please re-log in!')
      return
    }
    if (!factories.value || factories.value.length === 0) {
      alert('No factory data to share!')
      return
    }

    copied.value = false

    await handleCreation(factories.value)
  }

  const handleCreation = async (factoryData: Factory[]) => {
    try {
      const response = await fetch(`${apiUrl}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`,
        },
        body: JSON.stringify(factoryData),
      })
      const data: ShareDataCreationResponse = await response.json()
      if (response.ok) {
        shareId.value = data.shareId
        shareLink.value = `${window.location.origin}/share/${data.shareId}`
        dialog.value = true // Shows dialog
      } else {
        console.error('Registration failed:', data)
        alert(`Failed to create share link. Please report this error to GitHub! "${data}" `)
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error)
        alert(`Failed to create share link. Please report this error to GitHub! "${error}"`)
      }
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink.value)
    copied.value = true
  }
</script>
