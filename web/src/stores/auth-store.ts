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
    return token.value ?? ''
  }
  // ==== END TOKEN MANAGEMENT
  // ==== AUTH FLOWS
  const handleLogin = async (username: string, password: string): Promise<string | boolean> => {
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
        return true
      } else if (response.status === 400) {
        console.warn('Login: Invalid credentials.', response, data)
        return 'Credentials incorrect. Please try again.'
      } else if (response.status === 500) {
        console.error('Login: Backend 500ed!', response, data)
        return `Backend server error! Please report this on Discord!`
      } else {
        console.error('Login: Unknown response!', response, data)
        return 'Unknown response! Please report this on Discord!'
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Login Error:', error)
        return 'Backend server offline. Please report this on Discord!'
      }
      return false
    }
  }

  const handleRegister = async (username: string, password: string): Promise<string | boolean> => {
    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (response.ok) {
        // Log the user in automatically
        return await handleLogin(username, password)
      } else {
        console.error('Registration failed:', response, data)
        return `Registration failed. ${data.errorResponse?.errmsg || data.message}`
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error)
        return `Registration failed due to unknown error: ${error.message}`
      }
      return false
    }
  }

  const validateToken = async (token: string): Promise<boolean | string> => {
    if (!token) {
      console.error('No token provided!')
      return false
    }
    try {
      const response = await fetch(`${apiUrl}/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      })
      if (response.ok) {
        return true
      } else if (response.status === 401) {
        console.warn('Token invalid!')
        handleLogout()
        return 'invalid-token'
      } else if (response.status === 500) {
        console.error('Backend is offline!')
        return 'backend-offline'
      } else {
        return 'unexpected-response'
      }
    } catch (error) {
      handleLogout()
      console.error('Error during token validation:', error)
      return 'unknown-error'
    }
  }
  // ==== END AUTH FLOWS

  const setLoggedInUser = (username: string) => {
    loggedInUser.value = username ?? ''
    if (username === '') {
      localStorage.removeItem('loggedInUser')
    } else {
      localStorage.setItem('loggedInUser', username)
    }
  }

  const getLoggedInUser = (): string => {
    return loggedInUser.value ?? ''
  }

  const handleLogout = () => {
    setLoggedInUser('')
    setToken('')
  }

  // Return state, actions, and getters
  return {
    getToken,
    setToken,
    handleLogin,
    handleLogout,
    handleRegister,
    validateToken,
    getLoggedInUser,
  }
})
