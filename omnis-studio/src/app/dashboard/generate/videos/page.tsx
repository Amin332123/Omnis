"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Video,
  Sparkles,
  Download,
  RefreshCw,
  Loader2,
  Wand2,
  Play,
  Pause,
  Maximize2,
  X,
  Zap,
  Monitor,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LowCreditWarning } from "@/components/shared/low-credit-warning"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { OptionCard } from "@/components/generate/option-card"
import { ModelCard } from "@/components/generate/model-card"
import {
  videoModels,
  videoDurations,
  videoResolutions,
  motionIntensityOptions,
} from "@/lib/static-data"
import { useAuth } from "@/context/auth-context"
import { formatCredits } from "@/lib/credit-cost"
import { createVideoGeneration } from "@/lib/generations-api"
import { ApiError } from "@/lib/api"
import { showGenerationError, showSuccessToast } from "@/lib/error-handler"

type GenerationState = "empty" | "loading" | "generated"

interface GeneratedVideo {
  id: string
  prompt: string
  model: string
  duration: string
  resolution: string
  motion: string
  videoUrl?: string
  gradientFrom: string
  gradientTo: string
}

const GRADIENT_PALETTES = [
  { from: "#6366f1", to: "#8b5cf6" },
  { from: "#f59e0b", to: "#ef4444" },
  { from: "#10b981", to: "#059669" },
  { from: "#3b82f6", to: "#06b6d4" },
  { from: "#ec4899", to: "#f43f5e" },
  { from: "#8b5cf6", to: "#ec4899" },
  { from: "#f97316", to: "#f59e0b" },
  { from: "#14b8a6", to: "#10b981" },
]

function hashPrompt(prompt: string): number {
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    hash = prompt.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function getGradient(prompt: string, offset = 0) {
  const p = GRADIENT_PALETTES[(hashPrompt(prompt) + offset) % GRADIENT_PALETTES.length]
  return { gradientFrom: p.from, gradientTo: p.to }
}

const EXAMPLE_PROMPTS = [
  "Short product showcase video of a luxury watch rotating on a marble pedestal",
  "Social media promo for a new coffee blend with smooth panning shots",
  "Behind-the-scenes style clip of a photoshoot in a bright studio",
  "Seasonal advertisement with falling snow and warm holiday lighting",
]

function calculateVideoCredits(model: string, duration: string, resolution: string) {
  const baseRate = model === "premium-video" ? 3.0 : 1.5
  const durationSeconds = parseInt(duration, 10) || 5
  const resMultiplier = resolution === "1080p" ? 1.5 : 1
  return Math.round(baseRate * durationSeconds * resMultiplier)
}

const motionLabels = ["Low", "Medium", "High"]

const VIDEO_ASPECT_RATIOS = [
  { value: "16:9", label: "Landscape (16:9)", description: "YouTube, cinematic" },
  { value: "9:16", label: "Vertical (9:16)", description: "TikTok, Reels, Shorts" },
  { value: "1:1", label: "Square (1:1)", description: "Instagram posts" },
  { value: "4:3", label: "Standard (4:3)", description: "Retro, presentations" },
]

export default function GenerateVideosPage() {
  const { user, setUserCredits } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState(videoModels[0].value)
  const [duration, setDuration] = useState(videoDurations[1].value)
  const [resolution, setResolution] = useState(videoResolutions[0].value)
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [motionLevel, setMotionLevel] = useState([1])
  const [state, setState] = useState<GenerationState>("empty")
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null)

  const creditsRemaining = user?.credits ?? 0
  const creditsCost = calculateVideoCredits(model, duration, resolution)
  const curMotion = motionIntensityOptions[motionLevel[0]]
  const curMotionValue = curMotion?.value ?? "medium"
  const curMotionLabel = curMotion?.label ?? "Medium"

  const estimatedTime = duration === "15" ? "3-5 min" : duration === "10" ? "2-3 min" : "1-2 min"

  const handleEnhance = useCallback(() => {
    const suffixes = [
      ", cinematic lighting, smooth motion, high production value",
      ", professional grade, fluid camera movement, stunning visuals",
      ", dramatic atmosphere, precise composition, masterful lighting",
      ", immersive scene, rich details, seamless motion, vibrant colors",
    ]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    setPrompt((prev) => (prev.trim() ? prev.trim() + suffix : "A cinematic scene" + suffix))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      await showGenerationError(new ApiError(400, "Prompt is required"))
      return
    }
    if (state === "loading") return
    setState("loading")
    const { gradientFrom, gradientTo } = getGradient(prompt)

    try {
      const motionStrength = motionLevel[0] === 0 ? 2 : motionLevel[0] === 2 ? 9 : 5
      const res = await createVideoGeneration({
        prompt: prompt.trim(),
        duration: duration + "s",
        resolution,
        aspectRatio,
        motionStrength,
        model,
      })

      setCurrentVideo({
        id: res.jobId,
        prompt: prompt.trim(),
        model: res.model,
        duration: String(res.duration),
        resolution,
        motion: curMotionValue,
        videoUrl: res.videoUrl,
        gradientFrom,
        gradientTo,
      })
      setUserCredits(res.creditsRemaining)
      setState("generated")
      setIsPlaying(true)
      showSuccessToast("Video generated successfully!").catch(() => undefined)
    } catch (err) {
      await showGenerationError(err)
      setState("empty")
    }
  }, [prompt, model, duration, resolution, aspectRatio, motionLevel, curMotionValue, state, setUserCredits])

  const handleRegenerate = useCallback(async () => {
    if (!prompt.trim()) {
      await showGenerationError(new ApiError(400, "Prompt is required"))
      return
    }
    if (state === "loading") return
    setState("loading")

    const { gradientFrom, gradientTo } = getGradient(prompt, Date.now())

    try {
      const motionStrength = motionLevel[0] === 0 ? 2 : motionLevel[0] === 2 ? 9 : 5
      const res = await createVideoGeneration({
        prompt: prompt.trim(),
        duration: duration + "s",
        resolution,
        aspectRatio,
        motionStrength,
        model,
      })

      setCurrentVideo({
        id: res.jobId,
        prompt: prompt.trim(),
        model: res.model,
        duration: String(res.duration),
        resolution,
        motion: curMotionValue,
        videoUrl: res.videoUrl,
        gradientFrom,
        gradientTo,
      })
      setUserCredits(res.creditsRemaining)
      setState("generated")
      setIsPlaying(true)
      showSuccessToast("Video generated successfully!").catch(() => undefined)
    } catch (err) {
      await showGenerationError(err)
      setState("empty")
    }
  }, [prompt, model, duration, resolution, aspectRatio, motionLevel, curMotionValue, state, setUserCredits])

  const handleDownload = useCallback(async () => {
    if (!currentVideo?.videoUrl) return
    setIsDownloading(true)
    try {
      const response = await fetch(currentVideo.videoUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `video-${currentVideo.id}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error("Failed to download video", err)
      window.open(currentVideo.videoUrl, "_blank")
    } finally {
      setIsDownloading(false)
    }
  }, [currentVideo])


  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Generate Videos</h1>
        <p className="text-muted text-sm">Create short marketing videos, social media clips, and promotional content.</p>
      </motion.div>

      <LowCreditWarning credits={creditsRemaining} />

      <div className="flex items-center gap-2 px-1">
        <Zap className="h-4 w-4 text-warning" />
        <span className="text-sm text-muted">
          You have <span className="font-semibold text-foreground">{formatCredits(creditsRemaining)}</span> credits remaining
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-5 space-y-5">
                {/* Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Prompt</label>
                    <button
                      type="button"
                      onClick={handleEnhance}
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
                    >
                      <Wand2 className="h-3 w-3" />
                      Enhance
                    </button>
                  </div>
                  <div className="relative">
                    <Textarea
                      placeholder="Describe the video you want to create..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[110px] resize-none pr-9 text-sm leading-relaxed"
                    />
                    {prompt && (
                      <button
                        type="button"
                        onClick={() => setPrompt("")}
                        className="absolute top-2 right-2 h-6 w-6 rounded-md flex items-center justify-center text-muted hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Model */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Model</label>
                  <div className="grid grid-cols-2 gap-3">
                    {videoModels.map((m) => (
                      <ModelCard
                        key={m.value}
                        selected={model === m.value}
                        onClick={() => setModel(m.value)}
                        label={m.label}
                        description={m.description}
                        quality={m.quality}
                        speed={m.speed}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted px-1">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-warning" />
                      <span>Fast Video: Lower cost</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-accent" />
                      <span>Premium Video: Better quality</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Duration */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {videoDurations.map((d) => (
                      <OptionCard
                        key={d.value}
                        selected={duration === d.value}
                        onClick={() => setDuration(d.value)}
                        className="gap-1 py-3"
                      >
                        <span className="text-sm font-semibold">{d.label}</span>
                        <span className="text-[10px] text-muted">{calculateVideoCredits(model, d.value, resolution)} credits</span>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Resolution */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Resolution</label>
                  <div className="grid grid-cols-2 gap-2">
                    {videoResolutions.map((r) => (
                      <OptionCard
                        key={r.value}
                        selected={resolution === r.value}
                        onClick={() => setResolution(r.value)}
                        className="gap-1 py-3 flex-row"
                      >
                        {r.value === "1080p" ? (
                          <Monitor className="h-4 w-4" />
                        ) : (
                          <Smartphone className="h-4 w-4" />
                        )}
                        <div className="text-left">
                          <span className="text-sm font-semibold block">{r.label}</span>
                          <span className="text-[10px] text-muted">{r.description}</span>
                        </div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-2">
                    {VIDEO_ASPECT_RATIOS.map((ar) => (
                      <OptionCard
                        key={ar.value}
                        selected={aspectRatio === ar.value}
                        onClick={() => setAspectRatio(ar.value)}
                        className="gap-1 py-3"
                      >
                        <span className="text-sm font-semibold">{ar.label}</span>
                        <span className="text-[10px] text-muted">{ar.description}</span>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Motion Intensity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Motion Intensity</label>
                    <span className="text-xs font-medium text-accent">{curMotionLabel}</span>
                  </div>
                  <Slider
                    value={motionLevel}
                    onValueChange={setMotionLevel}
                    max={2}
                    step={1}
                    className="py-1"
                  />
                  <div className="flex justify-between text-[10px] text-muted">
                    {motionIntensityOptions.map((m) => (
                      <span key={m.value}>{m.description}</span>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Credits & CTA */}
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Cost Summary</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">This generation will use</span>
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-warning" />
                      <span className="font-semibold text-foreground">{formatCredits(creditsCost)} credits</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Estimated generation time</span>
                    <span>{estimatedTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted pt-1 border-t border-accent/10">
                    <span>Remaining after generation</span>
                    <span className="font-medium text-foreground">
                      {formatCredits(Math.max(0, creditsRemaining - creditsCost))} credits
                    </span>
                  </div>
                  <Button
                    className="w-full gap-2 h-11 text-base"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || state === "loading"}
                  >
                    {state === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Video
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* RIGHT PANEL */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:sticky lg:top-8 lg:self-start"
        >
          <Card className="overflow-hidden">
            <div className="bg-secondary/50 px-5 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Preview</h2>
                {state === "generated" && currentVideo && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(true)}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <CardContent className="p-0">
              <div className="min-h-[500px] flex flex-col">
                <AnimatePresence mode="wait">
                  {state === "empty" && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/10"
                      >
                        <Video className="h-9 w-9 text-accent/60" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Create short marketing videos</h3>
                      <p className="text-sm text-muted max-w-xs mb-8">
                        Describe the promotional video, social media clip, or product showcase you want to create.
                      </p>
                      <div className="space-y-2 w-full max-w-sm">
                        <p className="text-xs text-muted font-medium mb-3">Try one of these examples:</p>
                        {EXAMPLE_PROMPTS.map((ep) => (
                          <button
                            key={ep}
                            type="button"
                            onClick={() => setPrompt(ep)}
                            className="w-full text-left p-3 rounded-xl border border-border bg-card hover:bg-card-hover hover:border-accent/30 text-xs text-muted hover:text-foreground transition-all duration-200 leading-relaxed"
                          >
                            &ldquo;{ep}&rdquo;
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {state === "loading" && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col p-8"
                    >
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10"
                        >
                          <Video className="h-8 w-8 text-accent" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Processing your video</h3>
                        <p className="text-sm text-muted mb-2">
                          Estimated wait time: <span className="font-medium text-foreground">{estimatedTime}</span>
                        </p>
                        <Badge variant="secondary" className="mb-6 gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                          Queue position: #3
                        </Badge>
                        <div className="w-full max-w-xs space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted">
                              <span>Analyzing prompt</span>
                              <span className="text-success font-medium">Complete</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full w-full rounded-full bg-success" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted">
                              <span>Generating frames</span>
                              <span className="text-accent font-medium">62%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "62%" }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="h-full rounded-full bg-accent"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted">
                              <span>Rendering output</span>
                              <span className="text-accent font-medium">--</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full w-0 rounded-full bg-accent" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {state === "generated" && currentVideo && (
                    <motion.div
                      key="generated"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col"
                    >
                      {/* Video Player */}
                      <div
                        className="relative flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--color-border)_0%,_transparent_70%)]"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="relative w-full max-w-lg group cursor-pointer rounded-xl overflow-hidden shadow-lg border border-border bg-card"
                          style={{ aspectRatio: currentVideo.resolution === "720p" ? "16 / 9" : "9 / 16" }}
                        >
                          {currentVideo.videoUrl ? (
                            <video
                              ref={videoRef}
                              src={currentVideo.videoUrl}
                              className="w-full h-full object-cover"
                              controls={isPlaying}
                              loop
                              playsInline
                              onPlay={() => setIsPlaying(true)}
                              onPause={() => setIsPlaying(false)}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isPlaying) {
                                  videoRef.current?.pause()
                                } else {
                                  videoRef.current?.play().catch(() => {})
                                }
                              }}
                            />
                          ) : (
                            <div
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(135deg, ${currentVideo.gradientFrom}, ${currentVideo.gradientTo})`,
                              }}
                              onClick={() => setIsPlaying(!isPlaying)}
                            >
                              <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-white/20 blur-3xl" />
                                <div className="absolute bottom-1/3 right-1/4 w-1/3 h-1/3 rounded-full bg-black/10 blur-2xl" />
                              </div>
                              <div
                                className="absolute inset-0 opacity-[0.06]"
                                style={{
                                  backgroundImage:
                                    "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
                                  backgroundSize: "40px 40px",
                                }}
                              />
                            </div>
                          )}

                          {(!currentVideo.videoUrl || !isPlaying) && (
                            <div 
                              className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (currentVideo.videoUrl) {
                                  videoRef.current?.play().catch(() => {})
                                  setIsPlaying(true)
                                } else {
                                  setIsPlaying(!isPlaying)
                                }
                              }}
                            >
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                              >
                                <Play className="h-7 w-7 text-white ml-0.5" />
                              </motion.div>
                            </div>
                          )}

                          {isPlaying && (
                            <div className="absolute top-3 right-3 pointer-events-none">
                              <Badge variant="secondary" className="bg-black/60 text-white border-0 gap-1 backdrop-blur-sm">
                                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                                Playing
                              </Badge>
                            </div>
                          )}
                        </motion.div>
                      </div>

                      {/* Actions */}
                      <div className="px-5 py-3 border-t border-border flex items-center gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5 flex-1 h-8 text-xs"
                          onClick={handleDownload}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 flex-1 h-8 text-xs"
                          onClick={handleRegenerate}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Regenerate
                        </Button>
                        <Button
                          size="sm"
                          variant={isPlaying ? "default" : "outline"}
                          className="gap-1.5 h-8 text-xs"
                          onClick={() => {
                            if (!currentVideo.videoUrl) {
                              setIsPlaying(!isPlaying)
                              return
                            }
                            if (isPlaying) {
                              videoRef.current?.pause()
                            } else {
                              videoRef.current?.play().catch(() => {})
                            }
                          }}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="h-3.5 w-3.5" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5" />
                              Play
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Metadata */}
                      <div className="px-5 py-3 border-t border-border bg-secondary/30">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-muted block mb-0.5">Model</span>
                            <span className="text-foreground font-medium">
                              {videoModels.find((m) => m.value === currentVideo.model)?.label}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted block mb-0.5">Duration</span>
                            <span className="text-foreground font-medium">{duration}s</span>
                          </div>
                          <div>
                            <span className="text-muted block mb-0.5">Resolution</span>
                            <span className="text-foreground font-medium">{resolution}</span>
                          </div>
                          <div>
                            <span className="text-muted block mb-0.5">Credits</span>
                            <span className="text-foreground font-medium">{formatCredits(creditsCost)} used</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isFullscreen && currentVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="rounded-2xl overflow-hidden shadow-2xl cursor-pointer relative bg-card border border-border"
                style={{ 
                  aspectRatio: currentVideo.resolution === "720p" ? "16 / 9" : "9 / 16",
                  maxHeight: "80vh"
                }}
              >
                {currentVideo.videoUrl ? (
                  <video
                    ref={fullscreenVideoRef}
                    src={currentVideo.videoUrl}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <div
                    className="w-full h-full relative"
                    style={{
                      background: `linear-gradient(135deg, ${currentVideo.gradientFrom}, ${currentVideo.gradientTo})`,
                    }}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-white/20 blur-3xl" />
                      <div className="absolute bottom-1/3 right-1/4 w-1/3 h-1/3 rounded-full bg-black/10 blur-2xl" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {!isPlaying ? (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                        >
                          <Play className="h-9 w-9 text-white ml-1" />
                        </motion.div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
