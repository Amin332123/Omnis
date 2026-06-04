"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopNav } from "@/components/dashboard/top-nav"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 border-r border-border bg-sidebar" />
      <div className="lg:ml-60">
        <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 sm:px-6">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-full max-w-sm" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const toggleCollapsed = useCallback(() => setIsCollapsed((prev) => !prev), [])
  const toggleMobile = useCallback(() => setIsMobileOpen((prev) => !prev), [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [isLoading, user, router])

  if (isLoading || !user) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggleCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileToggle={toggleMobile}
      />

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "transition-all duration-200 ml-0",
          isCollapsed ? "lg:ml-16" : "lg:ml-60"
        )}
      >
        <TopNav onMenuClick={() => setIsMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={isCollapsed ? "collapsed" : "expanded"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
