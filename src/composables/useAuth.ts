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

// Session Lock & Inactivity Preferences
const autoLockMinutes = ref<string>(
  (typeof window !== 'undefined' && localStorage.getItem('dbb_auto_lock_minutes')) || '15'
)

const lockOnBlur = ref<boolean>(
  (typeof window !== 'undefined' && localStorage.getItem('dbb_lock_on_blur') === 'true') || false
)

const lastActivity = ref<number>(Date.now())
const lockReason = ref<string | null>(null)

// Initialize Global Idle & Blur Listeners
if (typeof window !== 'undefined') {
  const updateActivity = () => {
    lastActivity.value = Date.now()
  }

  window.addEventListener('mousemove', updateActivity, { passive: true })
  window.addEventListener('mousedown', updateActivity, { passive: true })
  window.addEventListener('keydown', updateActivity, { passive: true })
  window.addEventListener('touchstart', updateActivity, { passive: true })
  window.addEventListener('scroll', updateActivity, { passive: true })

  // Check idle interval every 4 seconds
  setInterval(() => {
    if (!currentUser.value) return
    const timeoutMins = Number(autoLockMinutes.value)
    if (timeoutMins <= 0 || isNaN(timeoutMins)) return

    const elapsed = Date.now() - lastActivity.value
    const maxIdleMs = timeoutMins * 60 * 1000

    if (elapsed >= maxIdleMs) {
      lockReason.value = `Session locked due to ${timeoutMins} minutes of inactivity.`
      currentUser.value = null
      localStorage.removeItem('dbb_user')
      if (window.location.hash !== '#/pin-login' && !window.location.pathname.includes('pin-login')) {
        window.location.hash = '#/pin-login'
      }
    }
  }, 4000)

  // Handle Window Blur
  window.addEventListener('blur', () => {
    if (lockOnBlur.value && currentUser.value) {
      lockReason.value = 'Session locked on window blur.'
      currentUser.value = null
      localStorage.removeItem('dbb_user')
      if (window.location.hash !== '#/pin-login' && !window.location.pathname.includes('pin-login')) {
        window.location.hash = '#/pin-login'
      }
    }
  })
}

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

  function touchActivity() {
    lastActivity.value = Date.now()
  }

  function setAutoLockMinutes(val: string) {
    autoLockMinutes.value = val
    if (typeof window !== 'undefined') {
      localStorage.setItem('dbb_auto_lock_minutes', val)
    }
  }

  function setLockOnBlur(val: boolean) {
    lockOnBlur.value = val
    if (typeof window !== 'undefined') {
      localStorage.setItem('dbb_lock_on_blur', val ? 'true' : 'false')
    }
  }

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

    // Reset lock reason and touch activity
    lockReason.value = null
    lastActivity.value = Date.now()

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

  function logout(reason?: string) {
    if (reason) {
      lockReason.value = reason
    }
    saveCurrentUser(null)
    router.push('/pin-login')
  }

  function lockNow() {
    lockReason.value = 'Session locked by user.'
    logout()
  }

  return {
    currentUser,
    user,
    isAuthenticated,
    autoLockMinutes,
    lockOnBlur,
    lockReason,
    touchActivity,
    setAutoLockMinutes,
    setLockOnBlur,
    login,
    logout,
    lockNow,
    changePin,
    updateUserProfile,
    getAppPin,
  }
}