export interface User {
  id: string
  email: string
  credits: number
  createdAt: string
  isAdmin?: boolean
  isEmailVerified?: boolean
  displayName?: string
  initials?: string
  avatarUrl?: string | null
  emailNotifications?: boolean
  marketingEmails?: boolean
}

export interface CreditPack {
  id: string
  name: string
  price: number
  credits: number
  popular?: boolean
  features?: string[]
  paddlePriceId?: string
}

export interface Generation {
  id: string
  type: "image" | "video"
  prompt: string
  creditsUsed: number
  createdAt: string
  status: "completed" | "processing" | "failed"
  model: string
  imageUrl?: string | null
  gradientFrom?: string
  gradientTo?: string
}

export interface Stat {
  label: string
  value: number
  icon: string
  trend?: number
}

export interface Transaction {
  id: string
  type: "purchase" | "generation" | "refund"
  credits: number
  description: string
  date: string
  status: "completed" | "pending" | "failed"
}

export interface FAQItem {
  question: string
  answer: string
}

export interface ImageGenerationOptions {
  prompt: string
  model: string
  size: string
}

export interface VideoGenerationOptions {
  prompt: string
  model: string
  duration: string
}
