"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  RefreshCw,
  Loader2,
  Wand2,
  Copy,
  Check,
  Maximize2,
  X,
  Clock,
  Zap,
  Sun,
  Monitor,
  Smartphone,
  Palette,
  Minus,
  Plus,
  Layers,
  Cpu,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Trash2,
  FileImage,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LowCreditWarning } from "@/components/shared/low-credit-warning"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { OptionCard } from "@/components/generate/option-card"
import {
  DEFAULT_FLUX_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_PROVIDER,
  FLUX_MODEL_OPTIONS,
  OPENAI_MODEL_OPTIONS,
  PROVIDER_OPTIONS,
  imageSizes,
  imageStyles,
  qualityOptions,
} from "@/lib/static-data"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useGenerations } from "@/context/generations-context"
import {
  createImageGeneration,
  type FluxModelVersion,
  type ImageProvider,
  type OpenAIModelVersion,
} from "@/lib/generations-api"
import { ApiError } from "@/lib/api"
import { calculateImageCredits, formatCredits } from "@/lib/credit-cost"
import { showGenerationError, showSuccessToast } from "@/lib/error-handler"

type GenerationState = "empty" | "loading" | "generated" | "error"

type StatusMessage = {
  type: "error" | "success"
  message: string
}

type AspectKey = "square_hd" | "portrait_hd" | "landscape_hd"

interface GeneratedImage {
  id: string
  prompt: string
  provider: ImageProvider
  modelVersion: string
  modelLabel: string
  quality: string
  size: string
  imageUrl: string
  creditsUsed: number
  referenceImageName?: string
}

const MAX_PROMPT_LENGTH = 500
const MAX_REFERENCE_IMAGE_BYTES = 4 * 1024 * 1024
const ACCEPTED_REFERENCE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

type ReferenceImage = {
  file: File
  previewUrl: string
}

const LOADING_STAGES = [
  { title: "Preparing prompt", description: "Polishing details and composition" },
  { title: "Contacting provider", description: "Sending request to the model" },
  { title: "Generating image", description: "Rendering textures and lighting" },
  { title: "Finalizing result", description: "Returning image to your library" },
]

const aspectIcons: Record<AspectKey, React.ReactNode> = {
  square_hd: <Monitor className="h-4 w-4" />,
  portrait_hd: <Smartphone className="h-4 w-4 rotate-90" />,
  landscape_hd: <Monitor className="h-4 w-4" />,
}

const EXAMPLE_PROMPTS = [
  "A cinematic product photo of a luxury perfume bottle on dark marble, golden rim light",
  "Modern minimalist coffee shop interior, warm natural light, instagram-ready",
  "Cozy home office with a laptop, soft window light, plants, lifestyle photo",
  "Autumn flat-lay with pumpkins, candles, and a knit blanket, social media post",
]

function getDownloadFilename(prompt: string, id: string) {
  const safe = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40)
  return `omnis-${safe || "image"}-${id.slice(0, 8)}`
}

function getPromptQuality(prompt: string) {
  const trimmed = prompt.trim()
  if (!trimmed) {
    return {
      score: 0,
      label: "Add detail",
      tone: "text-muted",
      hint: "Describe subject, style, lighting, and mood.",
    }
  }
  const wordCount = trimmed.split(/\s+/).length
  const lengthScore = Math.min(trimmed.length / MAX_PROMPT_LENGTH, 1)
  const detailScore = Math.min(wordCount / 26, 1)
  const hasStyle = /realistic|cinematic|anime|digital|product|3d|render/i.test(trimmed)
  const hasLighting = /lighting|backlit|studio|golden|neon|shadow|soft light/i.test(trimmed)
  const hasLens = /macro|wide|depth of field|bokeh|35mm|50mm|telephoto/i.test(trimmed)
  const score = Math.min(
    1,
    lengthScore * 0.45 +
      detailScore * 0.35 +
      (hasStyle ? 0.1 : 0) +
      (hasLighting ? 0.1 : 0) +
      (hasLens ? 0.1 : 0)
  )
  const percent = Math.round(score * 100)
  if (percent >= 75)
    return { score: percent, label: "Excellent", tone: "text-success", hint: "Balanced detail with strong creative direction." }
  if (percent >= 50)
    return { score: percent, label: "Strong", tone: "text-accent", hint: "Add lighting or composition cues for polish." }
  if (percent >= 25)
    return { score: percent, label: "Growing", tone: "text-warning", hint: "Add context, style, and shot details." }
  return { score: percent, label: "Basic", tone: "text-muted", hint: "Add subject, environment, and mood cues." }
}

function getAspectRatioStyle(size: string): React.CSSProperties {
  switch (size) {
    case "portrait_hd":
    case "832x1216":
    case "1024x1536":
      return { aspectRatio: "4 / 5", width: "min(100%, 384px)", minHeight: "420px" }
    case "landscape_hd":
    case "1216x832":
    case "1536x1024":
      return { aspectRatio: "16 / 9", width: "min(100%, 520px)", minHeight: "292px" }
    case "768x1344":
      return { aspectRatio: "9 / 16", width: "min(100%, 315px)", minHeight: "470px" }
    case "square_hd":
    case "1024x1024":
    default:
      return { aspectRatio: "1 / 1", width: "min(100%, 440px)", minHeight: "360px" }
  }
}

export default function GenerateImagesPage() {
  const { user, setUserCredits } = useAuth()
  const { refreshStats, refreshHistory } = useGenerations()

  const [prompt, setPrompt] = useState("")
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [isReferenceDragging, setIsReferenceDragging] = useState(false)
  const [provider, setProvider] = useState<ImageProvider>(DEFAULT_PROVIDER)
  const [fluxModel, setFluxModel] = useState<FluxModelVersion>(DEFAULT_FLUX_MODEL)
  const [openaiModel, setOpenaiModel] = useState<OpenAIModelVersion>(DEFAULT_OPENAI_MODEL)
  const [size, setSize] = useState<string>(imageSizes[0].value)
  const [style, setStyle] = useState<string>(imageStyles[0].value)
  const [quality, setQuality] = useState<string>(qualityOptions[0].value)

  const [state, setState] = useState<GenerationState>("empty")
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null)
  const [recentPrompts, setRecentPrompts] = useState<string[]>([])
  const [loadingStage, setLoadingStage] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [downloadState, setDownloadState] = useState<"idle" | "success">("idle")

  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [compareProvider, setCompareProvider] = useState<ImageProvider>(
    provider === "flux" ? "openai" : "flux"
  )
  const [compareFluxModel, setCompareFluxModel] = useState<FluxModelVersion>(DEFAULT_FLUX_MODEL)
  const [compareOpenaiModel, setCompareOpenaiModel] = useState<OpenAIModelVersion>(DEFAULT_OPENAI_MODEL)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareResult, setCompareResult] = useState<GeneratedImage | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)

  const previewRef = useRef<HTMLDivElement>(null)
  const referenceInputRef = useRef<HTMLInputElement>(null)
  const loadingIntervalRef = useRef<number | null>(null)
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null)

  const creditsRemaining = user?.credits ?? 0
  const promptLength = prompt.length
  const promptQuality = useMemo(() => getPromptQuality(prompt), [prompt])
  const activeModelVersion: FluxModelVersion | OpenAIModelVersion =
    provider === "flux" ? fluxModel : openaiModel
  const activeModelLabel = useMemo(() => {
    if (provider === "flux") {
      return FLUX_MODEL_OPTIONS.find((m) => m.value === fluxModel)?.label ?? fluxModel
    }
    return OPENAI_MODEL_OPTIONS.find((m) => m.value === openaiModel)?.label ?? openaiModel
  }, [provider, fluxModel, openaiModel])

  const clearLoadingAnimation = useCallback(() => {
    if (loadingIntervalRef.current) {
      window.clearInterval(loadingIntervalRef.current)
      loadingIntervalRef.current = null
    }
  }, [])

  const startLoadingAnimation = useCallback(() => {
    clearLoadingAnimation()
    setLoadingStage(0)
    setLoadingProgress(0)
    const start = Date.now()
    const totalMs = 22_000
    loadingIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start
      const eased = Math.min(1, elapsed / totalMs)
      const capped = Math.min(0.98, eased)
      const nextProgress = Math.round(capped * 100)
      setLoadingProgress(nextProgress)
      const nextStage = Math.max(0, Math.min(LOADING_STAGES.length - 1, Math.floor(nextProgress / 25)))
      setLoadingStage(nextStage)
    }, 120)
  }, [clearLoadingAnimation])

  useEffect(() => () => clearLoadingAnimation(), [clearLoadingAnimation])

  useEffect(
    () => () => {
      if (referenceImage?.previewUrl) {
        URL.revokeObjectURL(referenceImage.previewUrl)
      }
    },
    [referenceImage]
  )

  useEffect(() => {
    if (!isFullscreen) {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsFullscreen(false)
      }
      window.addEventListener("keydown", onKeyDown)
      return () => window.removeEventListener("keydown", onKeyDown)
    }
  }, [isFullscreen])

  const openFullscreen = useCallback(() => {
    setZoomLevel(1)
    setIsFullscreen(true)
  }, [])

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false)
    setZoomLevel(1)
  }, [])

  const setReferenceFile = useCallback((file: File | null) => {
    setReferenceError(null)

    if (!file) return

    if (!ACCEPTED_REFERENCE_IMAGE_TYPES.includes(file.type)) {
      setReferenceError("Use a JPG, PNG, or WebP image.")
      return
    }

    if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
      setReferenceError("Reference image must be 4MB or smaller.")
      return
    }

    setReferenceImage((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl)
      return {
        file,
        previewUrl: URL.createObjectURL(file),
      }
    })
  }, [])

  const clearReferenceImage = useCallback(() => {
    setReferenceImage((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl)
      return null
    })
    setReferenceError(null)
    if (referenceInputRef.current) referenceInputRef.current.value = ""
  }, [])

  const handleReferenceInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setReferenceFile(event.target.files?.[0] ?? null)
    },
    [setReferenceFile]
  )

  const handleReferenceDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsReferenceDragging(false)
      setReferenceFile(event.dataTransfer.files?.[0] ?? null)
    },
    [setReferenceFile]
  )

  const runGeneration = useCallback(
    async (
      providerChoice: ImageProvider,
      modelChoice: FluxModelVersion | OpenAIModelVersion,
      promptValue: string
    ) => {
      const trimmed = promptValue.trim()
      if (!trimmed) {
        await showGenerationError(new ApiError(400, "Prompt is required"))
        return null
      }
      if (state === "loading") return null
      const imageCost = calculateImageCredits(modelChoice, quality)
      if (creditsRemaining < imageCost) {
        await showGenerationError(new ApiError(402, "Insufficient credits"))
        return null
      }

      setStatusMessage(null)
      setState("loading")
      startLoadingAnimation()

      try {
        const response = await createImageGeneration({
          prompt: trimmed,
          provider: providerChoice,
          modelVersion: modelChoice,
          imageSize: size,
          style,
          quality,
          referenceImage: referenceImage?.file,
        })
        const modelLabel =
          (providerChoice === "flux"
            ? FLUX_MODEL_OPTIONS.find((m) => m.value === modelChoice)?.label
            : OPENAI_MODEL_OPTIONS.find((m) => m.value === modelChoice)?.label) ?? modelChoice

        const result: GeneratedImage = {
          id: response.jobId,
          prompt: trimmed,
          provider: response.provider ?? providerChoice,
          modelVersion: modelChoice,
          modelLabel,
          quality,
          size,
          imageUrl: response.imageUrl,
          creditsUsed: response.creditsUsed ?? imageCost,
          referenceImageName: referenceImage?.file.name,
        }
        setCurrentImage(result)
        setRecentPrompts((prev) => [trimmed, ...prev.filter((p) => p !== trimmed)].slice(0, 8))
        setUserCredits(response.creditsRemaining)
        refreshStats().catch(() => undefined)
        refreshHistory().catch(() => undefined)
        showSuccessToast("Image generated successfully!").catch(() => undefined)
        setState("generated")
        return result
      } catch (error) {
        await showGenerationError(error)
        setState(currentImage ? "generated" : "empty")
        return null
      } finally {
        clearLoadingAnimation()
        setLoadingStage(LOADING_STAGES.length - 1)
        setLoadingProgress(100)
      }
    },
    [state, creditsRemaining, size, style, quality, referenceImage, currentImage, setUserCredits, refreshStats, refreshHistory, startLoadingAnimation, clearLoadingAnimation]
  )

  const handleGenerate = useCallback(() => {
    runGeneration(provider, activeModelVersion, prompt).catch(() => undefined)
  }, [runGeneration, provider, activeModelVersion, prompt])

  const handleRegenerate = useCallback(() => {
    if (!prompt.trim()) return
    runGeneration(provider, activeModelVersion, prompt).catch(() => undefined)
  }, [runGeneration, provider, activeModelVersion, prompt])

  const handleProviderChange = useCallback((next: ImageProvider) => {
    setProvider(next)
    setStatusMessage(null)
  }, [])

  const handleFluxModelChange = useCallback((next: FluxModelVersion) => {
    setFluxModel(next)
    setStatusMessage(null)
  }, [])

  const handleOpenaiModelChange = useCallback((next: OpenAIModelVersion) => {
    setOpenaiModel(next)
    setStatusMessage(null)
  }, [])

  const handleEnhance = useCallback(() => {
    const suffixes = [
      ", highly detailed, 8K resolution, professional lighting",
      ", cinematic lighting, dramatic shadows, award-winning composition",
      ", trending on art station, hyperrealistic, volumetric lighting",
      ", masterpiece, intricate details, stunning visual quality",
    ]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    setPrompt((prev) => (prev.trim() ? prev.trim() + suffix : "A beautiful scene" + suffix))
  }, [])

  const downloadImage = useCallback((img: GeneratedImage) => {
    if (!img.imageUrl) return
    setDownloadState("success")
    const a = downloadLinkRef.current ?? document.createElement("a")
    a.href = img.imageUrl
    a.download = `${getDownloadFilename(img.prompt, img.id)}.png`
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    a.click()
    window.setTimeout(() => setDownloadState("idle"), 1400)
  }, [])

  const handleDownload = useCallback(() => {
    if (currentImage) downloadImage(currentImage)
  }, [currentImage, downloadImage])

  const handleCopy = useCallback(() => {
    if (!currentImage?.imageUrl) return
    if (currentImage.imageUrl.startsWith("data:")) {
      showGenerationError(new ApiError(400, "This image URL can't be copied to clipboard.")).catch(() => undefined)
      return
    }
    navigator.clipboard.writeText(currentImage.imageUrl).catch(() => undefined)
    setCopiedUrl(true)
    window.setTimeout(() => setCopiedUrl(false), 2000)
  }, [currentImage])

  const handleOpenInNewTab = useCallback(() => {
    if (!currentImage?.imageUrl || currentImage.imageUrl.startsWith("data:")) return
    window.open(currentImage.imageUrl, "_blank", "noopener,noreferrer")
  }, [currentImage])

  const openComparison = useCallback(() => {
    setCompareProvider(provider === "flux" ? "openai" : "flux")
    setCompareFluxModel(fluxModel === "flux-schnell" ? "flux-dev" : "flux-schnell")
    setCompareResult(null)
    setCompareError(null)
    setComparisonOpen(true)
  }, [provider, fluxModel])

  const closeComparison = useCallback(() => {
    if (compareLoading) return
    setComparisonOpen(false)
    setCompareResult(null)
    setCompareError(null)
  }, [compareLoading])

  const handleRunCompare = useCallback(async () => {
    if (!prompt.trim()) {
      await showGenerationError(new ApiError(400, "Prompt is required"))
      return
    }
    const compareModel: FluxModelVersion | OpenAIModelVersion =
      compareProvider === "flux" ? compareFluxModel : compareOpenaiModel
    const compareCost = calculateImageCredits(compareModel, quality)
    if (creditsRemaining < compareCost) {
      await showGenerationError(new ApiError(402, "Insufficient credits for comparison"))
      return
    }
    setCompareError(null)
    setCompareLoading(true)
    try {
      const response = await createImageGeneration({
        prompt: prompt.trim(),
        provider: compareProvider,
        modelVersion: compareModel,
        imageSize: size,
        style,
        quality,
        referenceImage: referenceImage?.file,
      })
      const label =
        (compareProvider === "flux"
          ? FLUX_MODEL_OPTIONS.find((m) => m.value === compareModel)?.label
          : OPENAI_MODEL_OPTIONS.find((m) => m.value === compareModel)?.label) ?? compareModel
      const result: GeneratedImage = {
        id: response.jobId,
        prompt: prompt.trim(),
        provider: response.provider ?? compareProvider,
        modelVersion: compareModel,
        modelLabel: label,
        quality,
        size,
        imageUrl: response.imageUrl,
        creditsUsed: response.creditsUsed ?? compareCost,
        referenceImageName: referenceImage?.file.name,
      }
      setCompareResult(result)
      setUserCredits(response.creditsRemaining)
      refreshStats().catch(() => undefined)
      refreshHistory().catch(() => undefined)
    } catch (error) {
      await showGenerationError(error)
    } finally {
      setCompareLoading(false)
    }
  }, [
    prompt,
    creditsRemaining,
    compareProvider,
    compareFluxModel,
    compareOpenaiModel,
    size,
    style,
    quality,
    referenceImage,
    setUserCredits,
    refreshStats,
    refreshHistory,
  ])

  const handleAdoptComparison = useCallback(() => {
    if (!compareResult) return
    setProvider(compareResult.provider)
    if (compareResult.provider === "flux") {
      setFluxModel(compareResult.modelVersion as FluxModelVersion)
    } else {
      setOpenaiModel(compareResult.modelVersion as OpenAIModelVersion)
    }
    setCurrentImage(compareResult)
    showSuccessToast(`Adopted ${compareResult.modelLabel} as the active result.`).catch(() => undefined)
    setComparisonOpen(false)
  }, [compareResult])

  const estimatedTime = quality === "ultra" ? "20-40s" : quality === "high" ? "10-25s" : "5-15s"
  const currentCost = useMemo(
    () => calculateImageCredits(activeModelVersion, quality),
    [activeModelVersion, quality],
  )
  const hasInsufficientCredits = creditsRemaining < currentCost

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Generate Images</h1>
        <p className="text-muted text-sm">
          Pick a provider, choose a model, and turn your idea into an image.
        </p>
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
                      placeholder="Describe the image you want to create..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
                      className="min-h-[110px] resize-none pr-9 text-sm leading-relaxed"
                    />
                    {prompt && (
                      <button
                        type="button"
                        onClick={() => setPrompt("")}
                        className="absolute top-2 right-2 h-6 w-6 rounded-md flex items-center justify-center text-muted hover:text-foreground hover:bg-secondary transition-colors"
                        aria-label="Clear prompt"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-muted flex items-center gap-2">
                        <span>
                          Prompt length:{" "}
                          <span className="text-foreground font-medium">{promptLength}</span>/
                          {MAX_PROMPT_LENGTH}
                        </span>
                      </div>
                      <div className="text-xs flex items-center gap-2">
                        <span className={`font-medium ${promptQuality.tone}`}>{promptQuality.label}</span>
                        <span className="text-muted">({promptQuality.score}%)</span>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-muted leading-tight max-w-[170px]">
                      {promptQuality.hint}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Inspiration image */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-3.5 w-3.5 text-muted" />
                      <label className="text-sm font-medium text-foreground">Inspiration image</label>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Optional
                    </Badge>
                  </div>

                  <input
                    ref={referenceInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleReferenceInputChange}
                  />

                  {referenceImage ? (
                    <div className="rounded-xl border border-border bg-secondary/40 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-card shrink-0">
                          <img
                            src={referenceImage.previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">
                            {referenceImage.file.name}
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            {(referenceImage.file.size / 1024 / 1024).toFixed(2)} MB · visual guidance
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => referenceInputRef.current?.click()}
                              disabled={state === "loading"}
                            >
                              <UploadCloud className="h-3.5 w-3.5" />
                              Replace
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5 text-xs text-error hover:text-error"
                              onClick={clearReferenceImage}
                              disabled={state === "loading"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => referenceInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          referenceInputRef.current?.click()
                        }
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setIsReferenceDragging(true)
                      }}
                      onDragLeave={() => setIsReferenceDragging(false)}
                      onDrop={handleReferenceDrop}
                      className={cn(
                        "group flex min-h-[112px] cursor-pointer items-center gap-4 rounded-xl border border-dashed p-4 transition-all duration-200",
                        isReferenceDragging
                          ? "border-accent bg-accent/10"
                          : "border-border bg-secondary/30 hover:border-accent/40 hover:bg-card-hover"
                      )}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted group-hover:text-accent">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          Add a visual reference
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          JPG, PNG, or WebP · max 4MB
                        </div>
                      </div>
                    </div>
                  )}

                  {referenceError ? (
                    <p className="text-xs text-error flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {referenceError}
                    </p>
                  ) : null}
                </div>

                <Separator />

                {/* Provider */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-muted" />
                    <label className="text-sm font-medium text-foreground">Provider</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {PROVIDER_OPTIONS.map((p) => {
                      const isActive = provider === p.value
                      return (
                        <motion.button
                          key={p.value}
                          type="button"
                          onClick={() => handleProviderChange(p.value)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            "relative w-full text-left rounded-xl border p-4 transition-all duration-200",
                            isActive
                              ? "border-accent bg-accent/5 shadow-sm"
                              : "border-border bg-card hover:border-accent/30 hover:bg-card-hover"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="provider-select"
                              className="absolute inset-0 rounded-xl border-2 border-accent"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <div className="relative space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  isActive ? "text-accent" : "text-foreground"
                                )}
                              >
                                {p.label}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {p.badge}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted leading-snug">{p.tagline}</p>
                            <p className="text-[11px] text-muted leading-snug">{p.description}</p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Model versions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-muted" />
                    <label className="text-sm font-medium text-foreground">
                      {provider === "flux" ? "Flux Version" : "OpenAI Model"}
                    </label>
                  </div>
                  <AnimatePresence mode="wait">
                    {provider === "flux" ? (
                      <motion.div
                        key="flux"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-1 gap-2"
                      >
                        {FLUX_MODEL_OPTIONS.map((m) => {
                          const minCost = calculateImageCredits(m.value, "standard")
                          const maxCost = calculateImageCredits(m.value, "ultra")
                          return (
                            <ModelRow
                              key={m.value}
                              label={m.label}
                              badge={m.badge}
                              description={m.description}
                              quality={m.quality}
                              speed={m.speed}
                              costLabel={
                                minCost === maxCost
                                  ? `${formatCredits(minCost)} credits`
                                  : `${formatCredits(minCost)} - ${formatCredits(maxCost)} credits`
                              }
                              selected={fluxModel === m.value}
                              onClick={() => handleFluxModelChange(m.value)}
                            />
                          )
                        })}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="openai"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-1 gap-2"
                      >
                        {OPENAI_MODEL_OPTIONS.map((m) => {
                          const minCost = calculateImageCredits(m.value, "standard")
                          const maxCost = calculateImageCredits(m.value, "ultra")
                          return (
                            <ModelRow
                              key={m.value}
                              label={m.label}
                              badge={m.badge}
                              description={m.description}
                              quality={m.quality}
                              speed={m.speed}
                              costLabel={
                                minCost === maxCost
                                  ? `${formatCredits(minCost)} credits`
                                  : `${formatCredits(minCost)} - ${formatCredits(maxCost)} credits`
                              }
                              selected={openaiModel === m.value}
                              onClick={() => handleOpenaiModelChange(m.value)}
                            />
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Separator />

                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {imageSizes.map((s) => (
                      <OptionCard
                        key={s.value}
                        selected={size === s.value}
                        onClick={() => setSize(s.value)}
                        className="gap-1.5 py-3"
                      >
                        {aspectIcons[s.value as AspectKey] ?? <ImageIcon className="h-4 w-4" />}
                        <span className="text-[11px] leading-tight">
                          {s.label.split(" ")[0]}
                        </span>
                        <span className="text-[10px] text-muted leading-tight">
                          {s.description}
                        </span>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Style */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5 text-muted" />
                    <label className="text-sm font-medium text-foreground">Style</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {imageStyles.map((st) => (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => setStyle(st.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
                          style === st.value
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted hover:border-accent/30 hover:text-foreground bg-card"
                        )}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Quality */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Quality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {qualityOptions.map((q) => {
                      const tierCost = calculateImageCredits(activeModelVersion, q.value)
                      return (
                        <OptionCard
                          key={q.value}
                          selected={quality === q.value}
                          onClick={() => setQuality(q.value)}
                          className="gap-1 py-2.5"
                        >
                          <span className="text-sm">{q.label}</span>
                          <span className="text-[10px] text-muted">{q.description}</span>
                          <span className="text-[10px] font-semibold text-accent">
                            {formatCredits(tierCost)} credits
                          </span>
                        </OptionCard>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Cost + Generate */}
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Summary</span>
                    <span className="text-xs text-muted">
                      {formatCredits(currentCost)} credit{currentCost !== 1 ? "s" : ""} / generation
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <SummaryRow label="Provider" value={provider === "flux" ? "Flux" : "OpenAI"} />
                    <SummaryRow label="Model" value={activeModelLabel} />
                    <SummaryRow label="Quality" value={quality} />
                    <SummaryRow label="Reference" value={referenceImage ? "Included" : "None"} />
                    <SummaryRow label="ETA" value={estimatedTime} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Remaining after generation</span>
                    <span className="font-medium text-foreground">
                      {formatCredits(Math.max(0, creditsRemaining - currentCost))} credits
                    </span>
                  </div>
                  <Button
                    className="w-full gap-2 h-11 text-base"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || state === "loading" || hasInsufficientCredits}
                  >
                    {state === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Image
                      </>
                    )}
                  </Button>
                  {hasInsufficientCredits ? (
                    <p className="text-xs text-error">
                      Not enough credits ({formatCredits(currentCost)} needed). Buy more from the Wallet page.
                    </p>
                  ) : null}
                  {statusMessage && statusMessage.type === "success" ? (
                    <div className="text-xs flex items-center gap-1.5 text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{statusMessage.message}</span>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Prompts */}
          <AnimatePresence>
            {recentPrompts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-3.5 w-3.5 text-muted" />
                      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Recent Prompts
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentPrompts.map((p, i) => (
                        <button
                          key={`${p}-${i}`}
                          type="button"
                          onClick={() => setPrompt(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs text-muted hover:text-foreground hover:bg-card-hover border border-border transition-colors truncate max-w-[200px]"
                        >
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="truncate">{p}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
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
                {state === "generated" && currentImage ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={openFullscreen}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-foreground hover:bg-secondary transition-colors"
                      aria-label="Fullscreen"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
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
                        <ImageIcon className="h-9 w-9 text-accent/60" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Create your first image
                      </h3>
                      <p className="text-sm text-muted max-w-xs mb-8">
                        Pick Flux or OpenAI, choose a model, and describe what you want.
                      </p>
                      <div className="space-y-2 w-full max-w-sm">
                        <p className="text-xs text-muted font-medium mb-3">Try one of these prompts:</p>
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
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10"
                        >
                          <Sparkles className="h-8 w-8 text-accent" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Creating your image
                        </h3>
                        <p className="text-sm text-muted mb-6">
                          Using {provider === "flux" ? "Flux" : "OpenAI"} · {activeModelLabel} ·{" "}
                          {estimatedTime}
                          {referenceImage ? " · with reference" : ""}
                        </p>

                        <div className="w-full max-w-xs space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-foreground truncate">
                                  {LOADING_STAGES[loadingStage]?.title ?? "Generating..."}
                                </div>
                                <div className="text-xs text-muted truncate">
                                  {LOADING_STAGES[loadingStage]?.description ?? "Working..."}
                                </div>
                              </div>
                              <div className="text-accent font-semibold text-sm tabular-nums shrink-0">
                                {loadingProgress}%
                              </div>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-accent"
                              initial={false}
                              animate={{ width: `${loadingProgress}%` }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted">
                            <span>Preparing</span>
                            <span>Finalizing</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {state === "generated" && currentImage && (
                    <motion.div
                      key="generated"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col"
                    >
                      <div
                        ref={previewRef}
                        className="relative flex min-h-[520px] items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--color-border)_0%,_transparent_70%)]"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="relative group cursor-pointer"
                          style={getAspectRatioStyle(currentImage.size)}
                          onClick={openFullscreen}
                        >
                          <div
                            className="w-full h-full rounded-xl overflow-hidden relative shadow-lg bg-secondary"
                          >
                            <img
                              src={currentImage.imageUrl}
                              alt={currentImage.prompt}
                              className="absolute inset-0 h-full w-full object-contain bg-black/5"
                            />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10" />
                          </div>
                        </motion.div>
                      </div>

                      {/* Actions row */}
                      <div className="px-5 py-3 border-t border-border flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5 flex-1 min-w-[120px] h-9 text-xs"
                          onClick={handleDownload}
                          disabled={!currentImage.imageUrl}
                        >
                          {downloadState === "success" ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Downloaded
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 flex-1 min-w-[120px] h-9 text-xs"
                          onClick={handleRegenerate}
                          disabled={!prompt.trim()}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Regenerate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 flex-1 min-w-[120px] h-9 text-xs"
                          onClick={openComparison}
                          disabled={!prompt.trim() || hasInsufficientCredits}
                        >
                          <Layers className="h-3.5 w-3.5" />
                          Compare
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-9 text-xs"
                          onClick={handleCopy}
                          disabled={!currentImage.imageUrl || currentImage.imageUrl.startsWith("data:")}
                          title={
                            currentImage.imageUrl.startsWith("data:")
                              ? "Cannot copy a base64 data URL"
                              : "Copy image URL"
                          }
                        >
                          {copiedUrl ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-success" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy URL
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 h-9 text-xs"
                          onClick={handleOpenInNewTab}
                          disabled={!currentImage.imageUrl || currentImage.imageUrl.startsWith("data:")}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </Button>
                      </div>

                      {/* Metadata */}
                      <div className="px-5 py-3 border-t border-border bg-secondary/30">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-muted block mb-0.5">Provider</span>
                            <span className="text-foreground font-medium">
                              {currentImage.provider === "flux" ? "Flux" : "OpenAI"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted block mb-0.5">Model</span>
                            <span className="text-foreground font-medium">
                              {currentImage.modelLabel}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted block mb-0.5">Cost</span>
                            <span className="text-foreground font-medium">
                              {formatCredits(currentImage.creditsUsed)} credit{currentImage.creditsUsed !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted block mb-0.5">ETA</span>
                            <span className="text-foreground font-medium">~{estimatedTime}</span>
                          </div>
                        </div>
                        {currentImage.referenceImageName ? (
                          <div className="mt-3 pt-3 border-t border-border">
                            <span className="text-muted block mb-0.5 text-xs">Reference</span>
                            <span className="text-foreground font-medium text-xs">
                              {currentImage.referenceImageName}
                            </span>
                          </div>
                        ) : null}
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted line-clamp-2">{currentImage.prompt}</p>
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
        {isFullscreen && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeFullscreen}
          >
            <button
              type="button"
              onClick={closeFullscreen}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Close fullscreen"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute left-4 top-4 flex items-center gap-2 z-[1]">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-10 w-10 rounded-full bg-white/10 text-white border-white/20 hover:bg-white/15"
                onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
                disabled={zoomLevel <= 1}
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="h-10 px-3 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-xs font-semibold">
                {Math.round(zoomLevel * 100)}%
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-10 w-10 rounded-full bg-white/10 text-white border-white/20 hover:bg-white/15"
                onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                disabled={zoomLevel >= 3}
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-10 px-4 rounded-full bg-white/10 text-white border-white/20 hover:bg-white/15"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                <span className="ml-2 text-xs font-medium">Download</span>
              </Button>
            </div>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="max-w-5xl max-h-[85vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="w-full rounded-2xl overflow-hidden shadow-2xl relative bg-secondary"
                style={{ aspectRatio: "1 / 1" }}
              >
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <div
                    className="relative w-full h-full"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <img
                      src={currentImage.imageUrl}
                      alt={currentImage.prompt}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison dialog */}
      <AnimatePresence>
        {comparisonOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeComparison}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="bg-card text-card-foreground rounded-2xl border border-border shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Compare providers</h3>
                  <p className="text-xs text-muted mt-0.5">
                    See how the same prompt looks on the other provider or a different model.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeComparison}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted hover:text-foreground hover:bg-secondary"
                  aria-label="Close comparison"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(90vh-72px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current */}
                  <div className="rounded-xl border border-border bg-background overflow-hidden">
                    <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                      <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Current
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {currentImage?.provider === "flux" ? "Flux" : "OpenAI"} ·{" "}
                        {currentImage?.modelLabel}
                      </Badge>
                    </div>
                    <div
                      className="aspect-square w-full bg-secondary flex items-center justify-center"
                    >
                      {currentImage ? (
                        <img
                          src={currentImage.imageUrl}
                          alt={currentImage.prompt}
                          className="h-full w-full object-contain"
                        />
                      ) : null}
                    </div>
                  </div>

                  {/* Compare */}
                  <div className="rounded-xl border border-border bg-background overflow-hidden">
                    <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                      <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Comparison
                      </div>
                      {compareResult ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {compareResult.provider === "flux" ? "Flux" : "OpenAI"} ·{" "}
                          {compareResult.modelLabel}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="aspect-square w-full bg-secondary flex items-center justify-center">
                      {compareLoading ? (
                        <div className="flex flex-col items-center gap-2 text-muted text-xs">
                          <Loader2 className="h-6 w-6 animate-spin text-accent" />
                          Generating comparison...
                        </div>
                      ) : compareResult ? (
                        <img
                          src={compareResult.imageUrl}
                          alt={compareResult.prompt}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-muted text-center px-6">
                          Pick a model and click <span className="text-foreground font-medium">Run comparison</span>.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-border bg-background p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-muted" />
                    <span className="text-sm font-medium text-foreground">Run with</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PROVIDER_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setCompareProvider(p.value)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200",
                          compareProvider === p.value
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted hover:border-accent/30 hover:text-foreground bg-card"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {compareProvider === "flux"
                      ? FLUX_MODEL_OPTIONS.map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setCompareFluxModel(m.value)}
                            className={cn(
                              "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 text-left",
                              compareFluxModel === m.value
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-muted hover:border-accent/30 hover:text-foreground bg-card"
                            )}
                          >
                            <div className="text-xs font-semibold">{m.label}</div>
                            <div className="text-[10px] text-muted leading-snug">
                              {m.description}
                            </div>
                          </button>
                        ))
                      : OPENAI_MODEL_OPTIONS.map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setCompareOpenaiModel(m.value)}
                            className={cn(
                              "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 text-left",
                              compareOpenaiModel === m.value
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-muted hover:border-accent/30 hover:text-foreground bg-card"
                            )}
                          >
                            <div className="text-xs font-semibold">{m.label}</div>
                            <div className="text-[10px] text-muted leading-snug">
                              {m.description}
                            </div>
                          </button>
                        ))}
                  </div>

                  {compareError ? (
                    <p className="text-xs text-error flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {compareError}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="gap-1.5 h-9 text-xs"
                      onClick={handleRunCompare}
                      disabled={compareLoading || !prompt.trim() || hasInsufficientCredits}
                    >
                      {compareLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Run comparison
                        </>
                      )}
                    </Button>
                    {compareResult ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-9 text-xs"
                          onClick={handleAdoptComparison}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Use this result
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-9 text-xs"
                          onClick={() => downloadImage(compareResult)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      </>
                    ) : null}
                    {hasInsufficientCredits ? (
                      <p className="text-xs text-error">Not enough credits to run a comparison.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <a ref={downloadLinkRef} className="hidden" aria-hidden="true" />
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted text-[10px] uppercase tracking-wider">{label}</span>
      <span className="text-foreground font-medium text-xs truncate">{value}</span>
    </div>
  )
}

function ModelRow({
  label,
  badge,
  description,
  quality,
  speed,
  costLabel,
  selected,
  onClick,
}: {
  label: string
  badge: string
  description: string
  quality: string
  speed: string
  costLabel: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className={cn(
        "relative w-full text-left rounded-xl border p-3 transition-all duration-200",
        selected
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border bg-card hover:border-accent/30 hover:bg-card-hover"
      )}
    >
      {selected && (
        <motion.div
          layoutId="model-row-select"
          className="absolute inset-0 rounded-xl border-2 border-accent"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className="relative flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-semibold",
                selected ? "text-accent" : "text-foreground"
              )}
            >
              {label}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {badge}
            </Badge>
            <span className="text-[10px] font-semibold text-accent ml-auto">
              {costLabel}
            </span>
          </div>
          <p className="text-[11px] text-muted leading-snug mt-1">{description}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end text-[10px] text-muted gap-0.5">
          <div className="flex items-center gap-1">
            <Sun className="h-3 w-3" />
            <span>{quality}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>{speed}</span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
