import { apiFetch } from "@/lib/api"
import type { User } from "@/lib/types"

export async function getCurrentCredits(): Promise<number> {
  const user = await apiFetch<User>("/auth/me", { auth: true })
  return user.credits
}

export type TransactionResponse = {
  id: string
  amount: number
  currency: string
  creditsPurchased: number
  creditsBefore: number
  creditsAfter: number
  status: string
  createdAt: string
}

export async function getPurchaseTransactions(): Promise<TransactionResponse[]> {
  return apiFetch<TransactionResponse[]>("/credits/transactions", { auth: true })
}
