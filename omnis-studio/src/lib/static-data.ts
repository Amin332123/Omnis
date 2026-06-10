import {
  type FluxModelVersion,
  type ImageModelVersion,
  type ImageProvider,
  type OpenAIModelVersion,
} from "@/lib/generations-api"
import { type CreditPack, type FAQItem } from "@/lib/types"

export const creditPacks: CreditPack[] = [
  {
    id: "starter",
    name: "Starter Pack",
    price: 29,
    credits: 100,
    features: [
      "~200 images (Schnell) or ~80 images (GPT Mini)",
      "~6 five-second videos",
      "Access to all models & quality tiers",
    ],
  },
  {
    id: "pro",
    name: "Pro Pack",
    price: 79,
    credits: 350,
    popular: true,
    features: [
      "~700 images (Schnell) or ~290 images (Dev)",
      "~23 five-second videos or ~14 ten-second videos",
      "Access to all models & quality tiers",
    ],
  },
  {
    id: "pro-max",
    name: "Pro Max Pack",
    price: 149,
    credits: 800,
    features: [
      "~1,600 images (Schnell) or ~660 images (Dev)",
      "~53 five-second videos or ~32 ten-second videos",
      "Access to all models & quality tiers",
    ],
  },
]

export const faqItems: FAQItem[] = [
  {
    question: "How do credits work?",
    answer:
      "Each image generation costs credits based on the model and the quality tier you pick. Faster / smaller models cost less, premium models cost more. The summary panel always shows the exact cost before you generate, and credits can be fractional (e.g. 0.5, 1.4, 2.7).",
  },
  {
    question: "Can I buy more credits anytime?",
    answer:
      "Yes, you can purchase additional credit packs at any time. Credits never expire and are added to your existing balance.",
  },
  {
    question: "What models are available?",
    answer:
      "We offer multiple image models from Flux and OpenAI, with Standard, High, and Ultra quality tiers. Video generation is coming soon with Fast and Premium tiers.",
  },
  {
    question: "Is there a free trial?",
    answer: "Every new account gets 1 free credit to try the platform. That is enough to generate one image and see what Omnis Studio can do. After that, you can purchase a credit pack to continue generating.",
  },
  {
    question: "How long does generation take?",
    answer:
      "Image generation typically takes 5-40 seconds depending on the model and quality tier you select.",
  },
  {
    question: "Can I use generated content commercially?",
    answer:
      "Yes, you own all content generated on Omnis Studio. You can use it for commercial projects, including marketing materials, social media posts, and product photos.",
  },
]

export const imageModels = [
  {
    value: "fast",
    label: "Fast",
    quality: "Good quality",
    speed: "Very fast",
    description: "Faster generation, lower credit cost",
  },
  {
    value: "premium",
    label: "Premium",
    quality: "Best quality",
    speed: "Fast",
    description: "Better quality, higher credit cost",
  },
]

export const videoModels = [
  {
    value: "fast-video",
    label: "Fast Video",
    quality: "Good quality",
    speed: "Fast",
    description: "Faster generation, lower credit cost",
  },
  {
    value: "premium-video",
    label: "Premium Video",
    quality: "Best quality",
    speed: "Moderate",
    description: "Better quality, higher credit cost",
  },
]

export const imageSizes = [
  { value: "square_hd", label: "Square (1:1)", description: "1024 × 1024" },
  { value: "portrait_hd", label: "Portrait (4:5)", description: "832 × 1216" },
  { value: "landscape_hd", label: "Landscape (16:9)", description: "1216 × 832" },
]

export const imageStyles = [
  { value: "realistic", label: "Realistic" },
  { value: "cinematic", label: "Cinematic" },
  { value: "anime", label: "Anime" },
  { value: "digital-art", label: "Digital Art" },
  { value: "product-photography", label: "Product Photography" },
  { value: "3d-render", label: "3D Render" },
]

export const qualityOptions = [
  { value: "standard", label: "Standard", description: "Fastest, lowest cost" },
  { value: "high", label: "High", description: "Balanced quality and cost" },
  { value: "ultra", label: "Ultra", description: "Best quality, highest cost" },
]

export const videoDurations = [
  { value: "5", label: "5 seconds", credits: 15 },
  { value: "10", label: "10 seconds", credits: 25 },
  { value: "15", label: "15 seconds", credits: 35 },
]

export const videoResolutions = [
  { value: "720p", label: "720p", description: "1280 × 720" },
  { value: "1080p", label: "1080p", description: "1920 × 1080" },
]

export const motionIntensityOptions = [
  { value: "low", label: "Low", description: "Gentle motion" },
  { value: "medium", label: "Medium", description: "Balanced motion" },
  { value: "high", label: "High", description: "Dynamic motion" },
]

export type ProviderOption = {
  value: ImageProvider
  label: string
  tagline: string
  description: string
  badge: string
}

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    value: "flux",
    label: "Flux",
    tagline: "Black Forest Labs",
    description: "Open-weight diffusion models served via fal.ai",
    badge: "Flux",
  },
  {
    value: "openai",
    label: "OpenAI",
    tagline: "GPT Image & DALL·E",
    description: "Native OpenAI image generation API",
    badge: "OpenAI",
  },
]

export type FluxModelOption = {
  value: FluxModelVersion
  label: string
  description: string
  speed: "Fastest" | "Fast" | "Slower"
  quality: "Good" | "High" | "Highest"
  badge: string
  baseCost: number
}

export const FLUX_MODEL_OPTIONS: FluxModelOption[] = [
  {
    value: "flux-schnell",
    label: "Flux Schnell",
    description: "Fastest Flux. 1-4 steps. Great for quick iteration and ideation.",
    speed: "Fastest",
    quality: "Good",
    badge: "Schnell",
    baseCost: 0.5,
  },
  {
    value: "flux-dev",
    label: "Flux Dev",
    description: "Higher quality, ~28 steps. Ideal for production-quality images.",
    speed: "Fast",
    quality: "High",
    badge: "Dev",
    baseCost: 1.2,
  },
  {
    value: "flux-pro",
    label: "Flux Pro 1.1",
    description: "Best quality via fal.ai Pro endpoint. Slower, premium output.",
    speed: "Slower",
    quality: "Highest",
    badge: "Pro",
    baseCost: 2.5,
  },
]

export type OpenAIModelOption = {
  value: OpenAIModelVersion
  label: string
  description: string
  speed: "Fast" | "Medium" | "Slow"
  quality: "Good" | "High" | "Highest"
  badge: string
  baseCost: number
}

export const OPENAI_MODEL_OPTIONS: OpenAIModelOption[] = [
  {
    value: "gpt-image-1",
    label: "GPT Image 1",
    description: "Latest flagship. Excellent prompt adherence and detail.",
    speed: "Medium",
    quality: "Highest",
    badge: "GPT",
    baseCost: 1.5,
  },
  {
    value: "gpt-image-1.5",
    label: "GPT Image 1.5",
    description: "Newer variant with refined composition and lighting.",
    speed: "Medium",
    quality: "Highest",
    badge: "GPT",
    baseCost: 1.8,
  },
  {
    value: "gpt-image-2",
    label: "GPT Image 2",
    description: "Newest generation. Premium quality, custom resolutions.",
    speed: "Medium",
    quality: "Highest",
    badge: "GPT",
    baseCost: 2.2,
  },
  {
    value: "gpt-image-2-2026-04-21",
    label: "GPT Image 2 (2026-04-21)",
    description: "Pinned version of GPT Image 2 for reproducible outputs.",
    speed: "Medium",
    quality: "Highest",
    badge: "GPT",
    baseCost: 2.2,
  },
  {
    value: "gpt-image-1-mini",
    label: "GPT Image 1 Mini",
    description: "Faster, lower cost GPT image. Great for many iterations.",
    speed: "Fast",
    quality: "High",
    badge: "Mini",
    baseCost: 0.8,
  },
]

export const ALL_IMAGE_MODEL_OPTIONS: ReadonlyArray<{
  value: ImageModelVersion
  label: string
  description: string
  badge: string
}> = [...FLUX_MODEL_OPTIONS, ...OPENAI_MODEL_OPTIONS]

export const DEFAULT_FLUX_MODEL: FluxModelVersion = "flux-schnell"
export const DEFAULT_OPENAI_MODEL: OpenAIModelVersion = "gpt-image-1"
export const DEFAULT_PROVIDER: ImageProvider = "flux"
