import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

const DEFAULT_USER: User = {
  id: '1',
  name: 'Marc Louie Cabigas',
  email: 'marclouie@dbb.com',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
}

// Your application PIN.
// For a local desktop application, this can be changed here.
const APP_PIN = '112233'

// Persistent authentication state
const storedUser = localStorage.getItem('dbb_user')

const currentUser = ref<User | null>(
  storedUser ? JSON.parse(storedUser) : null
)

function saveCurrentUser(user: User | null) {
  currentUser.value = user

  if (user) {
    localStorage.setItem('dbb_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('dbb_user')
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

    if (cleanPin !== APP_PIN) {
      return {
        success: false,
        error: 'Incorrect PIN. Please try again.',
      }
    }

    saveCurrentUser(DEFAULT_USER)

    return {
      success: true,
    }
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
  }
}