"use client"

import { motion } from "framer-motion"
import { ArrowRight, Image, Video, Zap, Sparkles, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/dashboard/stat-card"
import { LowCreditWarning } from "@/components/shared/low-credit-warning"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useGenerations } from "@/context/generations-context"
import { Skeleton } from "@/components/ui/skeleton"
import type { Stat } from "@/lib/types"
import { formatCredits } from "@/lib/credit-cost"

export default function DashboardPage() {
  const { user } = useAuth()
  const { stats, history, isLoadingStats, isLoadingHistory } = useGenerations()
  const recentGenerations = history.slice(0, 5)
  const creditsRemaining = stats?.creditsRemaining ?? user?.credits ?? 0
  const totalGenerations = stats?.totalGenerations ?? 0
  const totalImages = stats?.totalImages ?? 0
  const totalVideos = Math.max(0, totalGenerations - totalImages)
  const totalCreditsUsed = history.reduce((sum, gen) => sum + gen.creditsUsed, 0)
  const totalCredits = creditsRemaining + totalCreditsUsed
  const usagePercent = totalCredits > 0 ? Math.max(0, Math.min(100, (totalCreditsUsed / totalCredits) * 100)) : 0
  const displayName = user?.displayName ?? user?.email ?? "Account"

  const dashboardStats: Stat[] = [
    { label: "Credits Remaining", value: creditsRemaining, icon: "sparkles" },
    { label: "Total Images", value: totalImages, icon: "image" },
    { label: "Videos Generated", value: totalVideos, icon: "video" },
    { label: "Total Generations", value: totalGenerations, icon: "layers" },
  ]

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-muted text-sm">Overview of your content creation activity</p>
      </motion.div>

      <LowCreditWarning credits={creditsRemaining} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-accent/5 to-background p-6 sm:p-8"
      >
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-sm text-muted mb-1">Welcome back</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{displayName}</h2>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-warning" />
                <span className="text-lg font-semibold text-foreground">{formatCredits(creditsRemaining)}</span>
                <span className="text-muted">credits available</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/generate/images">
                <Button className="w-full sm:w-auto gap-2">
                  <Image className="h-4 w-4" />
                  Generate Image
                </Button>
              </Link>
              <Link href="/dashboard/generate/videos">
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  <Video className="h-4 w-4" />
                  Generate Video
                </Button>
              </Link>
              <Link href="/dashboard/billing">
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  <Sparkles className="h-4 w-4" />
                  Buy Credits
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingStats ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[122px]" />
          ))
        ) : (
          dashboardStats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {isLoadingHistory ? (
                <div className="space-y-3 py-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-9 w-9" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : recentGenerations.length > 0 ? (
                recentGenerations.map((gen, index) => (
                  <motion.div
                    key={gen.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 py-3 border-b border-border last:border-0"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                      {gen.type === "image" ? (
                        <Image className="h-4 w-4 text-muted" />
                      ) : (
                        <Video className="h-4 w-4 text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{gen.prompt}</p>
                      <p className="text-xs text-muted">
                        {new Date(gen.createdAt).toLocaleDateString()} &middot; {formatCredits(gen.creditsUsed)} credits
                      </p>
                    </div>
                    <Badge
                      variant={
                        gen.status === "completed"
                          ? "success"
                          : gen.status === "processing"
                            ? "warning"
                            : "destructive"
                      }
                      className="capitalize shrink-0"
                    >
                      {gen.status}
                    </Badge>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-muted py-4 text-center">No generations yet. Start creating!</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/generate/images">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Image className="h-4 w-4 text-accent" />
                <span>Generate Image</span>
              </Button>
            </Link>
            <Link href="/dashboard/generate/videos">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Video className="h-4 w-4 text-accent" />
                <span>Generate Video</span>
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>Buy Credits</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground">{formatCredits(creditsRemaining)} credits remaining</h3>
                <Badge className="bg-accent/10 text-accent border-accent/20">Available</Badge>
              </div>
              <div className="space-y-1.5 text-sm text-muted">
                <p>
                  <span className="text-foreground font-medium">{formatCredits(totalCreditsUsed)}</span> credits used this period
                </p>
                <p>
                  <span className="text-foreground font-medium">{formatCredits(totalCredits)}</span> total credits purchased
                </p>
              </div>
              <Link href="/dashboard/billing">
                <Button variant="outline" size="sm" className="mt-2 gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Buy More Credits
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted">Credit usage</span>
                  <span className="text-foreground font-medium">
                    {formatCredits(totalCreditsUsed)} / {formatCredits(totalCredits)} used
                  </span>
                </div>
                <Progress value={usagePercent} className="h-2.5" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{formatCredits(creditsRemaining)} credits remaining</span>
                <span className="text-foreground font-medium">{Math.round(usagePercent)}% used</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <p className="text-sm text-muted">
              Need more credits?{" "}
              <Link href="/dashboard/billing" className="text-accent font-medium hover:underline">
                View credit packs
              </Link>
            </p>
            <Link href="/dashboard/billing">
              <Button className="gap-2 w-full sm:w-auto">
                Buy Credits
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
