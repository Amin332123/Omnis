"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, Image, Video } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GenerationCard } from "@/components/dashboard/generation-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import type { Generation } from "@/lib/types"
import { useGenerations } from "@/context/generations-context"

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-2 border-t border-border">
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 flex-1 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const { history, isLoadingHistory, refreshHistory } = useGenerations()
  const [generations, setGenerations] = useState<Generation[]>([])

  useEffect(() => {
    setGenerations(history)
  }, [history])

  useEffect(() => {
    if (history.length === 0) {
      refreshHistory().catch(() => undefined)
    }
  }, [history.length, refreshHistory])

  const filtered = useMemo(() => {
    return generations.filter((gen) => {
      const matchesSearch = gen.prompt.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = activeTab === "all" || gen.type === activeTab
      return matchesSearch && matchesType
    })
  }, [generations, searchQuery, activeTab])

  const handleDelete = useCallback((id: string) => {
    setGenerations((prev) => prev.filter((g) => g.id !== id))
  }, [])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Content History</h1>
        <p className="text-muted text-sm">Browse all your past content generations</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-3 w-3" />
              All
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <Image className="h-3 w-3" />
              Images
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-2">
              <Video className="h-3 w-3" />
              Videos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <AnimatePresence mode="wait">
        {isLoadingHistory ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
              <EmptyState
                icon={<Search className="h-8 w-8" />}
                title="No content found"
                description={
                  searchQuery
                    ? "Try a different search term or filter."
                    : "You haven't created any content yet."
                }
                action={
                  !searchQuery ? (
                    <a href="/dashboard/generate/images">
                      <Button size="sm">Create your first product photo</Button>
                    </a>
                  ) : undefined
                }
              />
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((gen, index) => (
              <GenerationCard
                key={gen.id}
                generation={gen}
                index={index}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
