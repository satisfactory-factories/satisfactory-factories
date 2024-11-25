import { ref } from 'vue'
import { config } from '@/config/config'
import { InvalidTokenError } from '@/errors/InvalidTokenError'
import { BackendOutageError } from '@/errors/BackendOutageError'

export const useAuthStore = (fetchOverride?: typeof fetch) => {
  const fetchInstance = fetchOverride || fetch // Allow dependency injection for fetch
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

  const getToken = async () => {
    await validateToken(token.value) // Will fail if it throws an error
    return token.value ?? ''
  }

  const validateToken = async (token?: string): Promise<boolean | string> => {
    if (!token) {
      throw new InvalidTokenError('No token provided')
    }
    let response: Response
    try {
      response = await fetchInstance(`${apiUrl}/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      })
    } catch (error) {
      console.error('validateToken: Error during token validation:', error)
      throw new Error('validate-token could not be performed!')
    }
    if (!response) {
      console.error('validateToken: No response from server!')
      throw new Error('No response from server!')
    }
    if (response.ok) {
      return true
    } else if (response.status === 401) {
      console.warn('validateToken: Token invalid!')
      handleLogout()
      throw new InvalidTokenError()
    } else if (response.status === 500 || response.status === 502) {
      console.error('validateToken: Backend is offline!')
      throw new BackendOutageError()
    } else {
      throw new Error('validateToken: Unknown response during token validation')
    }
  }
  // ==== END TOKEN MANAGEMENT

  // ==== AUTH FLOWS
  const handleLogin = async (username: string, password: string): Promise<string | boolean> => {
    try {
      const response = await fetchInstance(`${apiUrl}/login`, {
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
        return true
      } else if (response.status === 400) {
        console.warn('handleLogin: Invalid credentials.', response, data)
        return 'Credentials incorrect. Please try again.'
      } else if (response.status === 500) {
        console.error('handleLogin: Backend 500ed!', response, data)
        return `Backend server error! Please report this on Discord!`
      } else if (response.status === 502) {
        console.error('handleLogin: Backend 502ed!', response, data)
        return `Backend server offline! Please report this to Maelstrome on Discord!`
      } else {
        console.error('handleLogin: Unknown response!', response, data)
        return 'Unknown response! Please report this on Discord!'
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Login Error:', error)
        return 'Backend server offline. Please report this on Discord!'
      }
      return 'An unknown login error occurred that could not be handled! Please report this on Discord!'
    }
  }

  const handleRegister = async (username: string, password: string): Promise<string | boolean> => {
    let response: Response
    try {
      response = await fetchInstance(`${apiUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error)
        return `Registration failed due to unknown error: ${error.message}`
      }
      return "Registration failed with an unknown error that wasn't caught!"
    }

    if (!response) {
      console.error('Registration failed: No response from server!', response)
      return 'Registration failed due to no response from the server!'
    }

    const data = await response.json()

    if (response.ok) {
      // Log the user in automatically
      return handleLogin(username, password)
    } else if (response.status === 400) {
      console.warn('handleRegister: Invalid details', response, data)
      return `User ${username} has already been registered.`
    } else if (response.status === 500) {
      console.error('handleRegister: Backend 500ed!', response, data)
      return `Backend server error! Please report this on Discord!`
    } else if (response.status === 502) {
      console.error('handleRegister: Backend 502ed!', response, data)
      return `Backend server offline! Please report this to Maelstrome on Discord!`
    } else {
      console.error('Registration failed:', response, data)
      return `Registration failed. ${data.errorResponse?.errmsg || data.message}`
    }
  }
  // ==== END AUTH FLOWS

  // ==== USER MANAGEMENT
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
  // ==== END USER MANAGEMENT

  // Return state, actions, and getters
  return {
    getToken,
    setToken,
    handleLogin,
    handleLogout,
    handleRegister,
    validateToken,
    getLoggedInUser,
    setLoggedInUser,
  }
}
