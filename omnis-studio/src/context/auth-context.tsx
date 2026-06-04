"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  type AuthUserResponse,
  login as loginRequest,
  register as registerRequest,
  sendVerificationCode as sendVerificationCodeRequest,
  verifyAndRegister as verifyAndRegisterRequest,
  getCurrentUser,
} from "@/lib/auth-api"
import {
  ApiError,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "@/lib/api"
import type { User } from "@/lib/types"

type AuthContextValue = {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  sendVerificationCode: (email: string, password: string) => Promise<void>
  verifyAndRegister: (email: string, code: string) => Promise<void>
  logout: () => void
  loadCurrentUser: () => Promise<void>
  setUserCredits: (credits: number) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")

const getDisplayName = (email: string) => {
  const prefix = email.split("@")[0] ?? ""
  const cleaned = prefix.replace(/[._-]+/g, " ").trim()
  return toTitleCase(cleaned || "User")
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()

const buildUser = (data: AuthUserResponse): User => {
  const displayName = getDisplayName(data.email)
  return {
    id: data.id,
    email: data.email,
    credits: data.credits,
    avatarUrl: data.avatarUrl,
    emailNotifications: data.emailNotifications,
    marketingEmails: data.marketingEmails,
    createdAt: data.createdAt,
    isAdmin: data.isAdmin,
    displayName,
    initials: getInitials(displayName),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadCurrentUser = useCallback(async () => {
    try {
      const profile = await getCurrentUser()
      setUser(buildUser(profile))
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearStoredToken()
        setToken(null)
        setUser(null)
        return
      }
      throw error
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest({ email, password })
    setStoredToken(response.accessToken)
    setToken(response.accessToken)
    await loadCurrentUser()
  }, [loadCurrentUser])

  const register = useCallback(async (email: string, password: string) => {
    await registerRequest({ email, password })
    await login(email, password)
  }, [login])

  const sendVerificationCode = useCallback(async (email: string, password: string) => {
    await sendVerificationCodeRequest({ email, password })
  }, [])

  const verifyAndRegister = useCallback(async (email: string, code: string) => {
    const response = await verifyAndRegisterRequest({ email, code })
    setStoredToken(response.accessToken)
    setToken(response.accessToken)
    await loadCurrentUser()
  }, [loadCurrentUser])

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  const setUserCredits = useCallback((credits: number) => {
    setUser((prev) => (prev ? { ...prev, credits } : prev))
  }, [])

  useEffect(() => {
    const storedToken = getStoredToken()
    if (!storedToken) {
      setIsLoading(false)
      return
    }

    setToken(storedToken)
    loadCurrentUser()
      .catch(() => undefined)
      .finally(() => setIsLoading(false))
  }, [loadCurrentUser])

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      sendVerificationCode,
      verifyAndRegister,
      logout,
      loadCurrentUser,
      setUserCredits,
    }),
    [user, token, isLoading, login, register, sendVerificationCode, verifyAndRegister, logout, loadCurrentUser, setUserCredits]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
