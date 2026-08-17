import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  status?: string
}

const DEFAULT_USER: User = {
  id: '1',
  name: 'Marc Louie Cabigas',
  email: 'marclouie@dbb.com',
  role: 'Systems Administrator',
  status: 'Active',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
}

// Default application PIN
const DEFAULT_APP_PIN = '112233'

function getAppPin(): string {
  if (typeof window === 'undefined') return DEFAULT_APP_PIN
  return localStorage.getItem('dbb_app_pin') || DEFAULT_APP_PIN
}

// Persistent authentication state
const storedUser = typeof window !== 'undefined' ? localStorage.getItem('dbb_user') : null

const currentUser = ref<User | null>(
  storedUser ? JSON.parse(storedUser) : null
)

function saveCurrentUser(user: User | null) {
  currentUser.value = user

  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('dbb_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('dbb_user')
    }
  }
}

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!currentUser.value)

  const user = computed(() => currentUser.value)

  function login(pin: string): {
    success: boolean
    error?: string
  } {
    const cleanPin = pin.trim()

    if (!cleanPin) {
      return {
        success: false,
        error: 'PIN is required.',
      }
    }

    const currentSavedPin = getAppPin()
    if (cleanPin !== currentSavedPin) {
      return {
        success: false,
        error: 'Incorrect PIN. Please try again.',
      }
    }

    // Merge with existing user if available
    const existing = currentUser.value || (storedUser ? JSON.parse(storedUser) : null)
    saveCurrentUser(existing || DEFAULT_USER)

    return {
      success: true,
    }
  }

  function changePin(currentPin: string, newPin: string): {
    success: boolean
    error?: string
  } {
    const cleanCurrent = currentPin.trim()
    const cleanNew = newPin.trim()
    const currentSavedPin = getAppPin()

    if (!cleanCurrent) {
      return { success: false, error: 'Current PIN is required.' }
    }
    if (cleanCurrent !== currentSavedPin) {
      return { success: false, error: 'Current PIN is incorrect.' }
    }
    if (!/^\d{6}$/.test(cleanNew)) {
      return { success: false, error: 'New PIN must be exactly 6 digits.' }
    }
    if (cleanNew === cleanCurrent) {
      return { success: false, error: 'New PIN cannot be the same as current PIN.' }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('dbb_app_pin', cleanNew)
    }

    return { success: true }
  }

  function updateUserProfile(data: Partial<User>) {
    if (!currentUser.value) {
      currentUser.value = { ...DEFAULT_USER, ...data }
    } else {
      currentUser.value = { ...currentUser.value, ...data }
    }
    saveCurrentUser(currentUser.value)
  }

  function logout() {
    saveCurrentUser(null)
    router.push('/pin-login')
  }

  return {
    currentUser,
    user,
    isAuthenticated,
    login,
    logout,
    changePin,
    updateUserProfile,
    getAppPin,
  }
}