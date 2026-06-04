"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Image,
  Video,
  Clock,
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Generation } from "@/lib/types"
import { formatCredits } from "@/lib/credit-cost"

interface GenerationCardProps {
  generation: Generation
  index?: number
  onDelete?: (id: string) => void
}

const statusVariant = {
  completed: "success" as const,
  processing: "warning" as const,
  failed: "destructive" as const,
}

const getDownloadFilename = (url: string, fallback: string) => {
  const cleanUrl = url.split("?")[0] ?? url
  const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/)
  const extension = match?.[1] ?? "png"
  return `${fallback}.${extension}`
}

export function GenerationCard({ generation, index = 0, onDelete }: GenerationCardProps) {
  const [viewOpen, setViewOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "success">("idle")
  const hasImageOutput = generation.type === "image" && Boolean(generation.imageUrl)
  const hasVideoOutput = generation.type === "video" && Boolean(generation.imageUrl)

  const handleDelete = () => {
    setDeleting(true)
    setTimeout(() => {
      onDelete?.(generation.id)
      setDeleting(false)
    }, 300)
  }

  const handleDownload = () => {
    if (!generation.imageUrl) return
    setDownloadState("loading")
    const link = document.createElement("a")
    link.href = generation.imageUrl
    link.download = getDownloadFilename(
      generation.imageUrl,
      `omnis-${generation.type}-${generation.id}`,
    )
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.click()
    setTimeout(() => setDownloadState("success"), 200)
    setTimeout(() => setDownloadState("idle"), 1400)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -2 }}
        className="group rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-accent/30"
      >
        <div
          className="aspect-video relative overflow-hidden"
          style={
            generation.gradientFrom && generation.gradientTo
              ? {
                  background: `linear-gradient(135deg, ${generation.gradientFrom}, ${generation.gradientTo})`,
                }
              : undefined
          }
        >
          {hasVideoOutput ? (
            <video
              src={generation.imageUrl ?? undefined}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              playsInline
              controls
              preload="metadata"
            />
          ) : hasImageOutput ? (
            <img
              src={generation.imageUrl ?? undefined}
              alt={generation.prompt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          {!generation.gradientFrom && !hasVideoOutput && !hasImageOutput && (
            <div className="absolute inset-0 bg-secondary flex items-center justify-center">
              {generation.type === "image" ? (
                <Image className="h-10 w-10 text-muted" />
              ) : (
                <Video className="h-10 w-10 text-muted" />
              )}
            </div>
          )}

          {generation.gradientFrom && (
            <>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-1/3 h-1/3 rounded-full bg-black/10 blur-2xl" />
              </div>
              <div className="absolute top-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-background/60 backdrop-blur-sm text-foreground border-0 gap-1"
                >
                  {generation.type === "image" ? (
                    <Image className="h-3 w-3" />
                  ) : (
                    <Video className="h-3 w-3" />
                  )}
                  {generation.type === "image" ? "Image" : "Video"}
                </Badge>
              </div>
            </>
          )}

          {generation.status === "processing" && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 text-accent animate-spin" />
                <span className="text-xs text-muted font-medium">Processing...</span>
              </div>
            </div>
          )}

          {generation.status === "failed" && (
            <div className="absolute inset-0 bg-background/40 flex items-center justify-center backdrop-blur-[1px]">
              <Badge variant="destructive">Failed</Badge>
            </div>
          )}

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Badge
              variant="secondary"
              className="bg-background/60 backdrop-blur-sm text-foreground border-0"
            >
              <Clock className="h-3 w-3 mr-1" />
              {new Date(generation.createdAt).toLocaleDateString()}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-foreground font-medium line-clamp-2 flex-1">
              {generation.prompt}
            </p>
            <Badge variant={statusVariant[generation.status]} className="shrink-0 capitalize">
              {generation.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {generation.model}
            </span>
            <span>{formatCredits(generation.creditsUsed)} credits</span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-8 flex-1"
              onClick={() => setViewOpen(true)}
            >
              <Eye className="h-3 w-3" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-8 flex-1"
              onClick={handleDownload}
              disabled={downloadState === "loading"}
            >
              {downloadState === "loading" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : downloadState === "success" ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              {downloadState === "success" ? "Downloaded" : "Download"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-8 flex-1 hover:text-error"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </motion.div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generation Details</DialogTitle>
            <DialogDescription>
              Created on {new Date(generation.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="w-full aspect-video rounded-lg overflow-hidden relative"
              style={
                generation.gradientFrom && generation.gradientTo
                  ? {
                      background: `linear-gradient(135deg, ${generation.gradientFrom}, ${generation.gradientTo})`,
                    }
                  : undefined
              }
            >
              {hasVideoOutput ? (
                <video
                  src={generation.imageUrl ?? undefined}
                  className="absolute inset-0 h-full w-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : hasImageOutput ? (
                  <img
                    src={generation.imageUrl ?? undefined}
                    alt={generation.prompt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
              ) : null}
              {!generation.gradientFrom && !hasVideoOutput && !hasImageOutput && (
                <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                  {generation.type === "image" ? (
                    <Image className="h-16 w-16 text-muted" />
                  ) : (
                    <Video className="h-16 w-16 text-muted" />
                  )}
                </div>
              )}
              {generation.gradientFrom && (
                <>
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-white/20 blur-3xl" />
                    <div className="absolute bottom-1/3 right-1/4 w-1/3 h-1/3 rounded-full bg-black/10 blur-2xl" />
                  </div>
                  <div
                    className="absolute inset-0 opacity-[0.08] pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {generation.type === "image" ? (
                      <Image className="h-16 w-16 text-white/30" />
                    ) : (
                      <Video className="h-16 w-16 text-white/30" />
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted">Prompt</span>
                <p className="text-foreground mt-0.5">{generation.prompt}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-muted">Model</span>
                  <p className="text-foreground mt-0.5">{generation.model}</p>
                </div>
                <div>
                  <span className="text-muted">Credits Used</span>
                  <p className="text-foreground mt-0.5">{formatCredits(generation.creditsUsed)}</p>
                </div>
                <div>
                  <span className="text-muted">Status</span>
                  <div className="mt-0.5">
                    <Badge variant={statusVariant[generation.status]} className="capitalize">
                      {generation.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="flex-1 gap-2" onClick={handleDownload} disabled={downloadState === "loading"}>
                {downloadState === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setViewOpen(false)
                  handleDelete()
                }}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
