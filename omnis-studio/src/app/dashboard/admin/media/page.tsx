"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Image,
  Video,
  Search,
  RefreshCw,
  Eye,
  Download,
  Sparkles,
  Clock,
  Filter,
  Users,
  Loader2,
  Check,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import {
  clearPreferredHomepageContent,
  getAdminGenerations,
  getPreferredHomepageContent,
  setPreferredHomepageContent,
} from "@/lib/admin-api"
import type {
  AdminGeneration,
  ListAllGenerationsParams,
  PreferredHomepageSlot,
} from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function MediaCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="pt-2 border-t border-border">
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}

const statusStyles: Record<string, "success" | "warning" | "destructive" | "default"> = {
  completed: "success",
  processing: "warning",
  failed: "destructive",
}

export default function AdminMediaPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [generations, setGenerations] = useState<AdminGeneration[]>([])
  const [preferredSlots, setPreferredSlots] = useState<PreferredHomepageSlot[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(false)
  const [savingSlot, setSavingSlot] = useState<number | null>(null)
  const [homepageError, setHomepageError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // View dialog
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedGeneration, setSelectedGeneration] = useState<AdminGeneration | null>(null)
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "success">("idle")

  const isAdmin = !!user?.isAdmin

  useEffect(() => {
    if (isLoading) return
    if (!user) return
    if (!user.isAdmin) router.replace("/dashboard")
  }, [isLoading, user, router])

  const fetchGenerations = useCallback(async () => {
    if (!user?.isAdmin) return
    setIsLoadingGenerations(true)
    try {
      const params: ListAllGenerationsParams = { page, pageSize }
      if (typeFilter !== "all") params.type = typeFilter as "image" | "video"
      if (statusFilter !== "all") params.status = statusFilter as "completed" | "processing" | "failed"
      if (searchQuery.trim()) params.search = searchQuery.trim()

      const [data, homepageContent] = await Promise.all([
        getAdminGenerations(params),
        getPreferredHomepageContent(),
      ])
      setGenerations(data.generations)
      setPreferredSlots(homepageContent.slots)
      setTotal(data.total)
    } finally {
      setIsLoadingGenerations(false)
    }
  }, [user?.isAdmin, page, pageSize, typeFilter, statusFilter, searchQuery])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchGenerations()
  }, [fetchGenerations])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const preferredSlotByGenerationId = useMemo(() => {
    const slots = new Map<string, number>()
    for (const item of preferredSlots) {
      if (item.generation) slots.set(item.generation.id, item.slot)
    }
    return slots
  }, [preferredSlots])

  const selectedHomepageCount = preferredSlots.filter((slot) => slot.generation).length

  const canFeatureGeneration = (gen: AdminGeneration) =>
    gen.type === "image" && gen.status === "completed" && Boolean(gen.imageUrl)

  const updatePreferredSlots = (data: { slots: PreferredHomepageSlot[] }) => {
    setPreferredSlots(data.slots)
    setHomepageError(null)
  }

  const handleSetHomepageSlot = async (slot: number, generationId: string) => {
    setSavingSlot(slot)
    try {
      updatePreferredSlots(await setPreferredHomepageContent(slot, generationId))
    } catch (error) {
      setHomepageError(error instanceof Error ? error.message : "Could not update homepage images.")
    } finally {
      setSavingSlot(null)
    }
  }

  const handleClearHomepageSlot = async (slot: number) => {
    setSavingSlot(slot)
    try {
      updatePreferredSlots(await clearPreferredHomepageContent(slot))
    } catch (error) {
      setHomepageError(error instanceof Error ? error.message : "Could not clear homepage slot.")
    } finally {
      setSavingSlot(null)
    }
  }

  const handleView = (gen: AdminGeneration) => {
    setSelectedGeneration(gen)
    setDownloadState("idle")
    setViewOpen(true)
  }

  const handleDownload = () => {
    if (!selectedGeneration?.imageUrl) return
    setDownloadState("loading")
    const link = document.createElement("a")
    link.href = selectedGeneration.imageUrl
    link.download = `omnis-${selectedGeneration.type}-${selectedGeneration.id}.png`
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.click()
    setTimeout(() => setDownloadState("success"), 200)
    setTimeout(() => setDownloadState("idle"), 1400)
  }

  if (!user || !isAdmin) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold text-foreground mb-1">Media Gallery</h1>
          <p className="text-muted text-sm">Access denied.</p>
        </motion.div>
      </div>
    )
  }

  const hasMedia = generations.length > 0

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-1">
          <Image className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Media Gallery</h1>
        </div>
        <p className="text-muted text-sm">Browse all images and videos generated by users</p>
      </motion.div>

      {/* Filters bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => {
                  setPage(1)
                  setSearchQuery(e.target.value)
                }}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Tabs value={typeFilter} onValueChange={(v) => { setPage(1); setTypeFilter(v) }}>
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="gap-2 text-xs px-3">
                    <Filter className="h-3 w-3" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="image" className="gap-2 text-xs px-3">
                    <Image className="h-3 w-3" />
                    Images
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2 text-xs px-3">
                    <Video className="h-3 w-3" />
                    Videos
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v) }}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9"
                onClick={() => {
                  setPage(1)
                  void fetchGenerations()
                }}
                disabled={isLoadingGenerations}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingGenerations ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats summary */}
      {hasMedia && !isLoadingGenerations && (
        <div className="flex items-center gap-4 text-sm text-muted flex-wrap">
          <span className="flex items-center gap-1.5">
            <Image className="h-3.5 w-3.5" />
            <strong className="text-foreground">{total}</strong> total items
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <strong className="text-foreground">
              {new Set(generations.map((g) => g.user.id)).size}
            </strong> users
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" />
            <strong className="text-foreground">{selectedHomepageCount}/6</strong> homepage slots selected
          </span>
        </div>
      )}

      {homepageError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{homepageError}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-destructive hover:text-destructive"
            onClick={() => setHomepageError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Media grid */}
      <AnimatePresence mode="wait">
        {isLoadingGenerations ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <MediaCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : !hasMedia ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <Image className="h-12 w-12 text-muted mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No media found</h3>
            <p className="text-sm text-muted max-w-sm">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "No users have generated any content yet."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {generations.map((gen, index) => {
              const featuredSlot = preferredSlotByGenerationId.get(gen.id)
              const canFeature = canFeatureGeneration(gen)

              return (
                <motion.div
                  key={gen.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  whileHover={{ y: -2 }}
                  className="group rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-accent/30"
                >
                <div className="aspect-video relative overflow-hidden bg-secondary">
                  {gen.type === "video" && gen.imageUrl ? (
                    <video
                      src={gen.imageUrl}
                      className="absolute inset-0 h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : gen.type === "image" && gen.imageUrl ? (
                    <img
                      src={gen.imageUrl}
                      alt={gen.prompt}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {gen.type === "image" ? (
                        <Image className="h-10 w-10 text-muted" />
                      ) : (
                        <Video className="h-10 w-10 text-muted" />
                      )}
                    </div>
                  )}

                  {gen.status === "processing" && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 text-accent animate-spin" />
                        <span className="text-xs text-muted font-medium">Processing...</span>
                      </div>
                    </div>
                  )}

                  {gen.status === "failed" && (
                    <div className="absolute inset-0 bg-background/40 flex items-center justify-center backdrop-blur-[1px]">
                      <Badge variant="destructive">Failed</Badge>
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <Badge
                      variant="secondary"
                      className="bg-background/60 backdrop-blur-sm text-foreground border-0 gap-1"
                    >
                      {gen.type === "image" ? (
                        <Image className="h-3 w-3" />
                      ) : (
                        <Video className="h-3 w-3" />
                      )}
                      {gen.type === "image" ? "Image" : "Video"}
                    </Badge>
                  </div>

                  {featuredSlot && (
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-accent text-accent-foreground border-0 gap-1">
                        <Star className="h-3 w-3" />
                        Home {featuredSlot}
                      </Badge>
                    </div>
                  )}

                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="secondary"
                      className="bg-background/60 backdrop-blur-sm text-foreground border-0 text-[10px]"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(gen.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground font-medium line-clamp-2 flex-1">
                      {gen.prompt}
                    </p>
                    <Badge variant={statusStyles[gen.status] ?? "default"} className="shrink-0 capitalize text-[10px]">
                      {gen.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {gen.model}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {gen.user.email}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Select
                        value={featuredSlot ? String(featuredSlot) : "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            if (featuredSlot) void handleClearHomepageSlot(featuredSlot)
                            return
                          }
                          void handleSetHomepageSlot(Number(value), gen.id)
                        }}
                        disabled={!canFeature || savingSlot !== null}
                      >
                        <SelectTrigger className="h-8 flex-1 text-xs">
                          <SelectValue placeholder="Home slot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not on home</SelectItem>
                          {Array.from({ length: 6 }).map((_, i) => {
                            const slot = i + 1
                            const slotGeneration = preferredSlots.find((item) => item.slot === slot)?.generation
                            const label = slotGeneration && slotGeneration.id !== gen.id
                              ? `Slot ${slot} - replace`
                              : `Slot ${slot}`

                            return (
                              <SelectItem key={slot} value={String(slot)}>
                                {label}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>

                      {featuredSlot && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => void handleClearHomepageSlot(featuredSlot)}
                          disabled={savingSlot !== null}
                          title="Clear homepage slot"
                        >
                          {savingSlot === featuredSlot ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs h-8 flex-1"
                      onClick={() => handleView(gen)}
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs h-8 flex-1"
                      onClick={() => {
                        if (!gen.imageUrl) return
                        const link = document.createElement("a")
                        link.href = gen.imageUrl
                        link.download = `omnis-${gen.type}-${gen.id}.png`
                        link.target = "_blank"
                        link.rel = "noopener noreferrer"
                        link.click()
                      }}
                      disabled={!gen.imageUrl}
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoadingGenerations}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>

          <div className="text-sm text-muted">
            Page <span className="text-foreground font-semibold">{page}</span> of{" "}
            <span className="text-foreground font-semibold">{totalPages}</span>
            <span className="mx-2">·</span>
            <span>{total} total items</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * pageSize >= total || isLoadingGenerations}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generation Details</DialogTitle>
            <DialogDescription>
              {selectedGeneration
                ? `By ${selectedGeneration.user.email} · ${new Date(selectedGeneration.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedGeneration && (
            <div className="space-y-4">
              <div className="w-full aspect-video rounded-lg overflow-hidden relative bg-secondary">
                {selectedGeneration.type === "video" && selectedGeneration.imageUrl ? (
                  <video
                    src={selectedGeneration.imageUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : selectedGeneration.type === "image" && selectedGeneration.imageUrl ? (
                  <img
                    src={selectedGeneration.imageUrl}
                    alt={selectedGeneration.prompt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {selectedGeneration.type === "image" ? (
                      <Image className="h-16 w-16 text-muted" />
                    ) : (
                      <Video className="h-16 w-16 text-muted" />
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted">Prompt</span>
                  <p className="text-foreground mt-0.5">{selectedGeneration.prompt}</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-muted">User</span>
                    <p className="text-foreground mt-0.5">{selectedGeneration.user.email}</p>
                  </div>
                  <div>
                    <span className="text-muted">Model</span>
                    <p className="text-foreground mt-0.5">{selectedGeneration.model}</p>
                  </div>
                  <div>
                    <span className="text-muted">Credits Used</span>
                    <p className="text-foreground mt-0.5">{selectedGeneration.creditsUsed}</p>
                  </div>
                  <div>
                    <span className="text-muted">Status</span>
                    <div className="mt-0.5">
                      <Badge variant={statusStyles[selectedGeneration.status] ?? "default"} className="capitalize">
                        {selectedGeneration.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setViewOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="gap-2"
                  onClick={handleDownload}
                  disabled={downloadState === "loading" || !selectedGeneration.imageUrl}
                >
                  {downloadState === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : downloadState === "success" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
