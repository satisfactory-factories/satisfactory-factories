<template>
  <v-dialog
    max-width="600"
    :model-value="showSessionExpiredAlert"
  >
    <v-card class="border-md">
      <v-card-title class="text-h5">Session Expired</v-card-title>
      <v-card-text>
        <p>Your session has expired, Pioneer. Please log in again!</p>
        <p>If this keeps happening repeatedly or much sooner than expected (30 days), please report it on Discord!</p>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="elevated" @click="closeSessionExpiredAlert">Ok</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <div class="position-absolute right-0 ma-2 mt-3 text-right">
    <v-btn v-if="!loggedInUser" @click="toggleTray">Sign In, Pioneer!</v-btn>
    <v-btn v-else @click="toggleTray"><i class="fas fa-user" /><span class="ml-2">{{ loggedInUser }}</span></v-btn>

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
            Register or log in to save your Plan(s). Whenever you make changes it will be automatically saved. You can also sync your factories between devices!
          </p>
          <v-divider />
          <v-form v-if="showLogin" @submit.prevent="handleLoginForm">
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
          <v-form v-if="showRegister" @submit.prevent="handleRegisterForm">
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
            <p class="text-left mb-2"><b>NOTE:</b> There is currently no password reset system implemented. If you lose your login details, you'll have to create a new account!</p>
            <v-btn color="green" type="submit">Register</v-btn>
          </v-form>
          <p v-if="errorMessage" class="text-red font-weight-bold mt-2">{{ errorMessage }}</p>
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
  import { ref } from 'vue'
  import { useAuthStore } from '@/stores/auth-store'

  const authStore = useAuthStore()

  const trayOpen = ref(false)
  const username = ref('')
  const password = ref('')
  const showLogin = ref(true)
  const showRegister = ref(false)
  const errorMessage = ref('')
  const loggedInUser = ref(authStore.getLoggedInUser())

  const showSessionExpiredAlert = ref(false)

  const toggleTray = () => {
    trayOpen.value = !trayOpen.value
  }

  // onMounted check if token is valid
  onMounted(async () => {
    const token = ref<string>(localStorage.getItem('token') ?? '')

    if (!token.value) {
      return
    }

    switch (await authStore.validateToken(token.value)) {
      case true:
        loggedInUser.value = authStore.getLoggedInUser()
        break
      case 'invalid-token':
        sessionHasExpired()
        break
      case 'backend-offline':
        errorMessage.value = 'The backend is currently offline. Please report this on Discord!'
        break
      case 'unexpected-response':
      default:
        errorMessage.value = 'An unexpected error occurred validating your token. Please report this on Discord!'
        break
    }
  })

  // Received from click events elsewhere
  const closeTray = () => {
    trayOpen.value = false
  }

  defineExpose({
    closeTray,
  })

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

  const sessionHasExpired = () => {
    showSessionExpiredAlert.value = true
    trayOpen.value = false
    showLogin.value = true
    loggedInUser.value = authStore.getLoggedInUser() // Should be ''
  }

  const handleLoginForm = async () => {
    errorMessage.value = ''
    if (username.value === '' || password.value === '') {
      errorMessage.value = 'Please fill in both fields.'
      return
    }

    const result = await authStore.handleLogin(username.value, password.value)
    if (result === true) {
      loggedInUser.value = authStore.getLoggedInUser()
    } else {
      errorMessage.value = `Login failed: ${result}`
    }
  }

  const handleLogout = async () => {
    authStore.handleLogout()
    loggedInUser.value = ''
  }

</script>

<style lang="scss" scoped>
.tray {
  position: absolute;
  top: 45px;
  right: 0;
  width: 400px;
  z-index: 10 !important;
  border: 1px solid rgb(108, 108, 108);
}
.lightRed {
  color: lightcoral;
}
</style>
