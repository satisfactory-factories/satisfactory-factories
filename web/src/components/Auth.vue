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
  <v-dialog
    :model-value="showSessionExpiredAlert"
  >
    <v-card class="border-md">
      <v-card-title class="text-h5">Session Expired</v-card-title>
      <v-card-text>
        <p>Your session has expired, Pioneer. Please log in again!</p>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="elevated" @click="closeSessionExpiredAlert">Ok</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <div class="position-absolute top-0 right-0 ma-2 text-right">
    <v-btn v-if="!loggedInUser" @click="toggleTray">Sign In, Pioneer!</v-btn>
    <v-btn v-else @click="toggleTray"><i class="fas fa-user" /><span class="ml-2">{{ loggedInUser }}</span></v-btn>
    <div v-show="isSaving">
      <p class="text-body-1">
        <i class="fas fa-sync fa-spin" /><span class="ml-2">Saving
        </span>
      </p>
    </div>
    <v-slide-x-transition>
      <v-card v-if="trayOpen" class="tray">
        <v-card-text v-if="!loggedInUser">
          <div class="text-center mb-4">
            <v-btn-group>
              <v-btn
                color="primary"
                :variant="showLogin === true ? 'flat' : 'tonal'"
                @click="showLoginForm"
              >Login</v-btn>
              <v-btn
                color="green"
                :variant="showRegister ? 'flat' : 'tonal'"
                @click="showRegisterForm"
              >Register</v-btn>
            </v-btn-group>
          </div>
          <p class="text-body-2 text-left mb-4">
            Register or log in to save your factories. Whenever you make changes it will be automatically saved. You can also sync your factories between devices!
          </p>
          <v-divider />
          <v-form v-if="showLogin" @submit.prevent="handleSignIn">
            <v-text-field
              v-model="username"
              label="Username"
              required
            />
            <v-text-field
              v-model="password"
              label="Password"
              required
              type="password"
            />
            <v-btn color="primary" type="submit">Log in</v-btn>
          </v-form>
          <v-form v-if="showRegister" @submit.prevent="handleRegister">
            <v-text-field
              v-model="username"
              label="Username"
              required
            />
            <v-text-field
              v-model="password"
              label="Password"
              required
              type="password"
            />
            <v-btn color="green" type="submit">Register</v-btn>
          </v-form>
          <p v-if="errorMessage" class="lightRed">{{ errorMessage }}</p>
        </v-card-text>

        <v-card-text v-if="loggedInUser" class="text-left text-body-1">
          <p class="mb-4">
            You are signed in. Your factory data will automatically saved. Should you wish to transfer the data to another device, ensure you're signed in then click the "Force Download" button.
          </p>
          <p class="mb-4">
            <i class="fas fa-save" /><span class="ml-2 font-weight-bold">Last saved:</span> {{ lastSavedDisplay }}
          </p>
          <v-btn
            class="mr-2"
            color="warning"
            @click="handleLogout"
          >Log out</v-btn>
          <v-btn
            color="primary"
            @click="confirmForceSync('This will delete your local data and pull it from the server. Continue?') && handleDataLoad(true)"
          >Force Download</v-btn>

        </v-card-text>
      </v-card>

    </v-slide-x-transition>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue'
  import { useAppStore } from '@/stores/app-store'
  import { storeToRefs } from 'pinia'
  import { config } from '@/config/config'

  const trayOpen = ref(false)
  const username = ref('')
  const password = ref('')
  const showLogin = ref(true)
  const showRegister = ref(false)
  const errorMessage = ref('')
  const apiUrl = config.apiUrl
  const lastSavedDisplay = ref('')
  const isSaving = ref(false)
  const showSessionExpiredAlert = ref(false)
  const showOverwriteDialog = ref(false)

  const dataToSave = ref({})
  const dataSavePending = ref(false)
  let saveInterval: NodeJS.Timeout

  const appStore = useAppStore()
  const { loggedInUser, token, factories, lastSave, lastEdit } = storeToRefs(appStore)

  watch(factories, newValue => {
    if (appStore.loggedInUser) {
      dataToSave.value = newValue
      dataSavePending.value = true
    }
  }, { deep: true })

  watch(lastSave, newValue => {
    lastSavedDisplay.value = lastSaveDateFormat(newValue)
  }, { deep: true })

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

  const toggleTray = () => {
    trayOpen.value = !trayOpen.value
  }

  // Received from click events elsewhere
  const closeTray = () => {
    trayOpen.value = false
  }

  defineExpose({
    closeTray,
  })

  const handleSignIn = async () => {
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.value, password: password.value }),
      })
      const data = await response.json()
      if (response.ok) {
        appStore.setLoggedInUser(username.value)
        appStore.setToken(data.token)
        username.value = ''
        password.value = ''
        await handleDataLoad()
      } else {
        console.warn('Login failed:', data)
        errorMessage.value = data.message
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch') {
          errorMessage.value = 'Could not connect to the server.'
          console.error('Error:', error)
        }
      }
    }
  }

  const handleRegister = async () => {
    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.value, password: password.value }),
      })
      const data = await response.json()
      if (response.ok) {
        await handleSignIn()
      } else {
        console.error('Registration failed:', data)
        errorMessage.value = `Registration failed. ${data.errorResponse?.errmsg || data.message}`
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error)
        errorMessage.value = error.message
      }
    }
  }

  const handleLogout = async () => {
    appStore.setLoggedInUser('')
    appStore.setToken('')
    showLogin.value = true
  }

  const showLoginForm = () => {
    showLogin.value = true
    showRegister.value = false
    errorMessage.value = ''
  }

  const showRegisterForm = () => {
    showLogin.value = false
    showRegister.value = true
    errorMessage.value = ''
  }

  const closeSessionExpiredAlert = () => {
    showSessionExpiredAlert.value = false
    trayOpen.value = true
    showLoginForm()
  }

  const sessionHasExpired = async () => {
    if (loggedInUser.value !== '') {
      showSessionExpiredAlert.value = true
      trayOpen.value = false
      await handleLogout()
    }
    // Otherwise do nothing, the user was never logged in.
  }

  const validateToken = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiUrl}/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`,
        },
        body: JSON.stringify({ token: token.value }),
      })
      if (response.ok) {
        return true
      } else {
        console.warn('Token invalid!')
        await sessionHasExpired()
        return false
      }
    } catch (error) {
      await sessionHasExpired()
      console.error('Error during token validation:', error)
      return false
    }
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

  // This function checks if there is any local data and the last time it was edited.
  // If it was edited after the last save, it will prompt the user to load the data.
  // Otherwise, it will immediately load the data into the store.
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
</script>

<style>
.tray {
  position: absolute;
  top: 0;
  right: 0;
  max-width: 400px;
  z-index: 10 !important;
  margin-top: 10px;
}
.lightRed {
  color: lightcoral;
}
</style>
