<template>
  <v-dialog v-model="showOverwriteDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Confirm Overwrite</v-card-title>
      <v-card-text>
        You have unsaved changes locally. Do you want to overwrite your changes with the saved data from the server?
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="confirmOverwrite">Overwrite</v-btn>
        <v-btn color="secondary" @click="cancelOverwrite">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div v-show="isSaving">
    <p class="text-body-1">
      <i class="fas fa-sync fa-spin" /><span class="ml-2">Saving
      </span>
    </p>
  </div>
</template>

<script lang="ts" setup>

  // This function checks if there is any local data and the last time it was edited.
  // If it was edited after the last save, it will prompt the user to load the data.
  // Otherwise, it will immediately load the data into the store.
  import { onMounted, ref, watch } from 'vue'

  const dataToSave = ref({})
  const dataSavePending = ref(false)
  let saveInterval: NodeJS.Timeout
  const showOverwriteDialog = ref(false)
  const isSaving = ref(false)
  const lastSavedDisplay = ref('Not saved yet, make a change!')

  const handleDataLoad = async (forceLoad = false) => {
    if (!await validateToken()) {
      return
    }

    if (forceLoad) {
      console.log('Forcing data load...')
    }

    try {
      const response = await fetch(`${apiUrl}/load`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`,
        },
      })
      const data = await response.json()
      const realData = data?.data
      if (response.ok) {
        if (!realData) {
          console.warn('No data found in response. Could be first time user has logged in.')
          return
        }

        if (forceLoad) {
          console.log('Forcing data load...')
          appStore.setFactories(realData)
          return
        }

        const lastSaved = new Date(realData.lastSaved)
        const oos = lastEdit.value && lastEdit.value > lastSaved // Check for desync

        if (oos) {
          console.log('Data is out of sync. Prompting user for overwrite.')
          showOverwriteDialog.value = true
          return
        }

        console.log('Data loaded:', realData)
        appStore.setFactories(realData)
      } else {
        console.error('Data load failed:', data)
      }
    } catch (error) {
      console.error('Data load errored:', error)
    }
  }

  // Function to convert date object to desired format
  const lastSaveDateFormat = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const day = String(date.getDate()).padStart(2, '0')
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }

  onMounted(() => {
    // Start interval to check if data needs to be saved
    saveInterval = setInterval(async () => {
      if (dataSavePending.value) {
        await handleDataSave(dataToSave.value)
        dataSavePending.value = false // Reset the pending save flag after save
      }
    }, 10000)

    if (loggedInUser && token) {
      validateToken()
    }

    console.log(process.env)
  })

  onBeforeUnmount(() => {
    // Clear the interval to avoid memory leaks when component unmounts
    if (saveInterval) {
      clearInterval(saveInterval)
    }
  })

  onUnmounted(() => {
    // Clear interval again in case onBeforeUnmount is not triggered (hot reloads)
    if (saveInterval) {
      clearInterval(saveInterval)
    }
  })

  watch(factories, newValue => {
    if (appStore.loggedInUser) {
      dataToSave.value = newValue
      dataSavePending.value = true
    }
  }, { deep: true })

  watch(lastSave, newValue => {
    lastSavedDisplay.value = lastSaveDateFormat(newValue)
  }, { deep: true })

  const confirmOverwrite = () => {
    console.log('Overwriting local data with server data...')
    handleDataLoad(true)
    showOverwriteDialog.value = false
  }

  const cancelOverwrite = () => {
    showOverwriteDialog.value = false
  }

  const confirmForceSync = (message: string) => {
    return confirm(message)
  }

  const handleDataSave = async (data: any) => {
    // If user is not logged in we do nothing
    if (loggedInUser.value === '') {
      return
    }

    isSaving.value = true

    if (!await validateToken()) {
      isSaving.value = false
      return
    }

    console.log('Saving data:', data)
    // Send a POST request to the /sync endpoint with the data in question
    try {
      const response = await fetch(`${apiUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`,
        },
        body: JSON.stringify(data),
      })
      await response.json()
      if (response.ok) {
        console.log('Data was saved.')
        appStore.setLastSave()
        isSaving.value = false
      } else {
        console.error('Data save failed at response!', data)
      }
    } catch (error) {
      console.error('Data save errored!', data)
    }
  }
</script>
