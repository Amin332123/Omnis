"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { getGenerationHistory, getGenerationStats } from "@/lib/generations-api"
import { getGradientFromPrompt } from "@/lib/generation-utils"
import { ApiError, getApiErrorMessage } from "@/lib/api"
import type { Generation } from "@/lib/types"
import { useAuth } from "@/context/auth-context"

type GenerationStats = {
  creditsRemaining: number
  totalGenerations: number
  totalImages: number
}

type GenerationsContextValue = {
  stats: GenerationStats | null
  history: Generation[]
  isLoadingStats: boolean
  isLoadingHistory: boolean
  error: string | null
  refreshStats: () => Promise<void>
  refreshHistory: () => Promise<void>
}

const GenerationsContext = createContext<GenerationsContextValue | undefined>(undefined)

export function GenerationsProvider({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<GenerationStats | null>(null)
  const [history, setHistory] = useState<Generation[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshStats = useCallback(async () => {
    if (!user) return
    setIsLoadingStats(true)
    try {
      const data = await getGenerationStats()
      setStats(data)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        return
      }
      setError(getApiErrorMessage(err, "Unable to load stats."))
    } finally {
      setIsLoadingStats(false)
    }
  }, [user, logout])

  const refreshHistory = useCallback(async () => {
    if (!user) return
    setIsLoadingHistory(true)
    try {
      const data = await getGenerationHistory()
      const mapped = data.map((job) => {
        const { gradientFrom, gradientTo } = getGradientFromPrompt(job.prompt)
        return {
          id: job.id,
          type: job.type,
          prompt: job.prompt,
          creditsUsed: job.creditsUsed,
          createdAt: job.createdAt,
          status: job.status,
          model: job.model,
          imageUrl: job.imageUrl ?? job.outputUrl ?? null,
          gradientFrom,
          gradientTo,
        }
      })
      setHistory(mapped)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        return
      }
      setError(getApiErrorMessage(err, "Unable to load history."))
    } finally {
      setIsLoadingHistory(false)
    }
  }, [user, logout])

  useEffect(() => {
    if (!user) {
      setStats(null)
      setHistory([])
      return
    }
    refreshStats().catch(() => undefined)
    refreshHistory().catch(() => undefined)
  }, [user, refreshHistory, refreshStats])

  const value = useMemo(
    () => ({
      stats,
      history,
      isLoadingStats,
      isLoadingHistory,
      error,
      refreshStats,
      refreshHistory,
    }),
    [stats, history, isLoadingStats, isLoadingHistory, error, refreshStats, refreshHistory]
  )

  return <GenerationsContext.Provider value={value}>{children}</GenerationsContext.Provider>
}

export const useGenerations = () => {
  const context = useContext(GenerationsContext)
  if (!context) {
    throw new Error("useGenerations must be used within GenerationsProvider")
  }
  return context
}
