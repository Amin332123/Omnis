"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Zap, Plus, ArrowUpRight, Image, Video, RefreshCw, CreditCard, Wallet, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PricingCard } from "@/components/shared/pricing-card"
import { getPlans, mapPlanToCreditPack, type PlanResponse } from "@/lib/plans-api"
import { initPaddle, openPaddleCheckout } from "@/lib/paddle"
import { getCurrentCredits, getPurchaseTransactions, type TransactionResponse } from "@/lib/credits-api"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useGenerations } from "@/context/generations-context"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCredits } from "@/lib/credit-cost"

const transactionIcons: Record<string, React.ReactNode> = {
  purchase: <Plus className="h-4 w-4 text-success" />,
  generation: <Zap className="h-4 w-4 text-accent" />,
  refund: <RefreshCw className="h-4 w-4 text-warning" />,
}

const POLL_INTERVAL_MS = 2000
const POLL_MAX_DURATION_MS = 60000

export default function WalletPage() {
  const { user, setUserCredits } = useAuth()
  const { history, isLoadingHistory } = useGenerations()
  const [plans, setPlans] = useState<PlanResponse[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseTxns, setPurchaseTxns] = useState<TransactionResponse[]>([])
  const [isLoadingTxns, setIsLoadingTxns] = useState(true)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingStartRef = useRef<number>(0)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setIsPurchasing(false)
  }, [])

  const startPolling = useCallback(() => {
    pollingStartRef.current = Date.now()
    setIsPurchasing(true)
    let initialCredits: number | null = null

    pollingRef.current = setInterval(async () => {
      if (Date.now() - pollingStartRef.current > POLL_MAX_DURATION_MS) {
        stopPolling()
        return
      }

      try {
        const newCredits = await getCurrentCredits()
        if (initialCredits === null) {
          initialCredits = newCredits
        } else if (newCredits !== initialCredits) {
          setUserCredits(newCredits)
          stopPolling()
        }
      } catch {
        // continue polling
      }
    }, POLL_INTERVAL_MS)
  }, [setUserCredits, stopPolling])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "true") {
      console.log("[billing] success redirect detected, polling for credits")
      startPolling()
      window.history.replaceState({}, "", window.location.pathname)
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [startPolling])

  const handlePurchase = useCallback(async (packId: string, paddlePriceId?: string) => {
    if (!paddlePriceId || isPurchasing) return

    setIsPurchasing(true)

    try {
      const initialized = await initPaddle()
      if (!initialized) {
        console.error("Paddle failed to initialize")
        setIsPurchasing(false)
        return
      }

      const opened = await openPaddleCheckout({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customData: { user_id: user?.id ?? "" },
        settings: {
          displayMode: "overlay",
          theme: "dark",
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
        },
      })

      if (!opened) {
        console.error("Paddle checkout failed to open")
        setIsPurchasing(false)
        return
      }

      startPolling()
    } catch (error) {
      console.error("Purchase error", error)
      setIsPurchasing(false)
    }
  }, [user?.id, isPurchasing, startPolling])

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setIsLoadingPlans(false))

    getPurchaseTransactions()
      .then(setPurchaseTxns)
      .catch(() => {})
      .finally(() => setIsLoadingTxns(false))
  }, [])

  const allTransactions = [
    ...purchaseTxns.map((txn) => ({
      id: `purchase-${txn.id}`,
      type: "purchase" as const,
      credits: txn.creditsPurchased,
      description: `Purchased ${txn.creditsPurchased} credits`,
      date: txn.createdAt,
      status: txn.status as "completed" | "pending" | "failed",
    })),
    ...history.map((gen) => ({
      id: `gen-${gen.id}`,
      type: "generation" as const,
      credits: -gen.creditsUsed,
      description: `${gen.type === "image" ? "Image" : "Video"} Generation - ${gen.prompt.slice(0, 48)}${gen.prompt.length > 48 ? "..." : ""}`,
      date: gen.createdAt,
      status: gen.status === "processing" ? "pending" as const : gen.status as "completed" | "failed",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const creditsRemaining = user?.credits ?? 0
  const totalUsedCredits = history.reduce((sum, gen) => sum + gen.creditsUsed, 0)
  const totalPurchased = creditsRemaining + totalUsedCredits
  const usagePercent = totalPurchased > 0 ? (totalUsedCredits / totalPurchased) * 100 : 0
  const transactions = allTransactions

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Wallet</h1>
        <p className="text-muted text-sm">Manage your credits and view transaction history</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-accent/10 via-accent/5 to-background">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent/5 blur-3xl" />
          <CardContent className="relative p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-muted">Current Credit Balance</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
              <div>
                <p className="text-4xl sm:text-5xl font-bold text-foreground">{formatCredits(creditsRemaining)}</p>
                <p className="text-sm text-muted mt-1">Available credits</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-foreground">{formatCredits(totalUsedCredits)}</p>
                <p className="text-sm text-muted mt-1">Credits used</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-foreground">{formatCredits(totalPurchased)}</p>
                <p className="text-sm text-muted mt-1">Total purchased</p>
              </div>
            </div>

            <div className="mt-6 max-w-md">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Usage</span>
                <span className="text-foreground font-medium">{Math.round(usagePercent)}% used</span>
              </div>
              <Progress value={usagePercent} className="h-2.5" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-xl font-bold text-foreground mb-6"
        >
          Buy Credits
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoadingPlans ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-8 space-y-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-4 w-32" />
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            ))
          ) : plans.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted">
              <CreditCard className="h-8 w-8 mx-auto mb-3" />
              <p>No credit packs available at this time.</p>
            </div>
          ) : (
            plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              >
                <PricingCard
                  pack={mapPlanToCreditPack(plan)}
                  onSelect={(id) => {
                    const p = plans.find((p) => p.id === id)
                    handlePurchase(id, p?.paddlePriceId ?? undefined)
                  }}
                  disabled={isPurchasing}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Credit Transactions</CardTitle>
            <p className="text-sm text-muted mt-1">Your credit purchase and usage history</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {(isLoadingHistory || isLoadingTxns) ? (
              <div className="space-y-4 py-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((txn, index) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center",
                        txn.credits > 0 ? "bg-success/10" : "bg-accent/10",
                      )}
                    >
                      {transactionIcons[txn.type]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{txn.description}</p>
                      <p className="text-xs text-muted">
                        {new Date(txn.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        txn.credits > 0 ? "text-success" : "text-foreground"
                      )}
                    >
                      {txn.credits > 0 ? "+" : ""}{formatCredits(txn.credits)}
                    </span>
                    <Badge
                      variant={txn.status === "completed" ? "success" : txn.status === "pending" ? "warning" : "destructive"}
                      className="capitalize"
                    >
                      {txn.status}
                    </Badge>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-8 text-center">
                <CreditCard className="h-8 w-8 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">No transactions yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
