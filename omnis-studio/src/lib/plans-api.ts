import { apiFetch } from "@/lib/api"
import type { CreditPack } from "@/lib/types"

export type PlanResponse = {
  id: string
  name: string
  credits: number
  price: number
  paddlePriceId: string | null
  features: string[]
  popular: boolean
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export const getPlans = () => apiFetch<PlanResponse[]>("/plans")

export const getAllPlans = () => apiFetch<PlanResponse[]>("/admin/plans")

export const createPlan = (data: {
  name: string
  credits: number
  price: number
  features?: string[]
  popular?: boolean
  active?: boolean
  sortOrder?: number
}) =>
  apiFetch<PlanResponse>("/admin/plans", {
    method: "POST",
    body: data,
  })

export const updatePlan = (
  id: string,
  data: {
    name?: string
    credits?: number
    price?: number
    features?: string[]
    popular?: boolean
    active?: boolean
    sortOrder?: number
  },
) =>
  apiFetch<PlanResponse>(`/admin/plans/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: data,
  })

export const deletePlan = (id: string) =>
  apiFetch<{ success: boolean }>(`/admin/plans/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })

export const mapPlanToCreditPack = (plan: PlanResponse): CreditPack => ({
  id: plan.id,
  name: plan.name,
  price: plan.price,
  credits: plan.credits,
  popular: plan.popular,
  features: plan.features,
  paddlePriceId: plan.paddlePriceId ?? undefined,
})
