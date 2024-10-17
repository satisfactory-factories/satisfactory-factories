<template>
  <div class="position-absolute top-0 right-0 ma-2 text-right">
    <v-btn v-if="!loggedInUser" @click="toggleTray">Sign In, Pioneer!</v-btn>
    <v-btn v-else @click="toggleTray">Hello again, {{ loggedInUser }}!</v-btn>
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
          <p class="mb-4">You are signed in. As of now your factories will be automatically saved. Should you lose your data (unless you wiped it!), simply log back in again.</p>
          <p class="mb-4"><i class="fas fa-save" /><span class="ml-2 font-weight-bold">Last saved:</span> 2024-05-05 00:00:00</p>
          <v-btn color="primary" @click="saveNow">Save</v-btn>
          <v-btn color="warning" @click="handleLogout">Log out</v-btn>

        </v-card-text>
      </v-card>

    </v-slide-x-transition>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'

  const trayOpen = ref(false)
  const username = ref('')
  const password = ref('')
  const loggedIn = ref(false)
  const loggedInUser = ref('')
  const token = ref('')
  const showLogin = ref(true)
  const showRegister = ref(false)
  const errorMessage = ref('')
  const apiUrl = 'http://localhost:3001'
  const lastSaved = ref('')
  const isSaving = ref(false)

  const toggleTray = () => {
    trayOpen.value = !trayOpen.value
  }

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
        console.log('User logged in')
        loggedIn.value = true
        loggedInUser.value = username.value
        token.value = data.token
        localStorage.setItem('loggedInUser', username.value)
        localStorage.setItem('token', data.token)
        username.value = ''
        password.value = ''
      } else {
        console.error('Login failed:', data)
        loggedIn.value = false
        errorMessage.value = data.message
      }
    } catch (error) {
      console.error('Error:', error)
      loggedIn.value = false
      errorMessage.value = error.message
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
        loggedIn.value = false
        errorMessage.value = `Registration failed. ${data.errorResponse?.errmsg || data.message}`
      }
    } catch (error) {
      console.error('Error:', error)
      loggedIn.value = false
      errorMessage.value = error.message
    }
  }

  const handleLogout = async () => {
    loggedIn.value = ''
    loggedInUser.value = ''
    token.value = ''
    showLogin.value = true
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem('token')
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

  onMounted(() => {
    const savedUser = localStorage.getItem('loggedInUser')
    const savedToken = localStorage.getItem('token')
    if (savedUser && savedToken) {
      console.log('User already logged in:', savedUser)
      loggedIn.value = true
      loggedInUser.value = savedUser
      token.value = savedToken
    }
  })

  const saveNow = async () => {
    console.log('saving now')
    const data = {
      foo: 'bar!',
    }
    await handleDataSave(data)
  }

  const handleDataSave = async (data: any) => {
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
        console.log('data saved')
        lastSaved.value = new Date().toISOString()
      } else {
        console.error('Data save failed at response!', data)
      }
    } catch (error) {
      console.error('Data save errored!', data)
    }
  }

  const handleDataLoad = async () => {
    isSaving.value = true
    // Send a gGET request to the /load endpoint to load the user's data and overwrite the local data
    try {
      const response = await fetch(`${apiUrl}/load`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`,
        },
      })
      const data = await response.json()

      isSaving.value = false
      if (response.ok) {
        console.log('Data loaded:', data)
      } else {
        console.error('Data load failed at response!', data)
      }
    } catch (error) {
      isSaving.value = false
      console.error('Data load errored!', data)
    }
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
.lightGreen {
  color: lightgreen;
}
</style>
