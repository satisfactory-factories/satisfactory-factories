// Utilities
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { config } from '@/config/config'
import { handleDataLoad } from '@/utils/backend/syncing'

export const useAuthStore = defineStore('auth', () => {
  const apiUrl = config.apiUrl
  const loggedInUser = ref<string>(localStorage.getItem('loggedInUser') ?? '')
  const token = ref<string>(localStorage.getItem('token') ?? '')

  // ==== TOKEN MANAGEMENT
  const setToken = (tokenValue: string) => {
    token.value = tokenValue ?? ''
    if (tokenValue === '') {
      localStorage.removeItem('token')
    } else {
      localStorage.setItem('token', tokenValue)
    }
  }

  const getToken = () => {
    return token.value
  }

  const handleSignIn = async (username: string, password: string) => {
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (response.ok) {
        setLoggedInUser(username)
        setToken(data.token)
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
  // ==== END TOKEN MANAGEMENT

  const setLoggedInUser = (username: string) => {
    loggedInUser.value = username ?? ''
    if (username === '') {
      localStorage.removeItem('loggedInUser')
    } else {
      localStorage.setItem('loggedInUser', username)
    }
  }

  const getLoggedInUser = () => {
    return loggedInUser.value
  }

  const handleLogout = async () => {
    setLoggedInUser('')
    setToken('')
  }

  // Return state, actions, and getters
  return {
    getToken,
    setToken,
  }
})
