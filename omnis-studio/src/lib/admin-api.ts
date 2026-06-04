import { apiFetch } from "@/lib/api"

export type AdminStatsResponse = {
  totalUsers: number
  creditsTotal: number
  totalCreditsUsed: number
  totalGenerations: number
}

export type AdminUser = {
  id: string
  email: string
  credits: number
  createdAt: string
  generationCount: number
}

export type AdminUsersListResponse = {
  page: number
  pageSize: number
  total: number
  users: AdminUser[]
}

export type SeriesPoint = {
  date: string
  // credits usage series
  creditsUsed?: number
  // new users series
  newUsers?: number
}

export type CreditsUsageSeriesResponse = Array<{
  date: string
  creditsUsed: number
}>

export type NewUsersSeriesResponse = Array<{
  date: string
  newUsers: number
}>

export type UpdateUserCreditsPayload = {
  credits: number
}

export type UpdateUserCreditsResponse = { success: true }

export type ResetUserPasswordPayload = {
  password: string
}

export type ResetUserPasswordResponse = { success: true }

export type DeleteUserResponse = { success: true }

export const getAdminStats = () => apiFetch<AdminStatsResponse>("/admin/stats")

export const getAdminUsers = (params: {
  page?: number
  pageSize?: number
  query?: string
}) => {
  const q = new URLSearchParams()
  if (params.page !== undefined) q.set("page", String(params.page))
  if (params.pageSize !== undefined) q.set("pageSize", String(params.pageSize))
  if (params.query !== undefined && params.query.trim().length > 0) q.set("query", params.query)

  return apiFetch<AdminUsersListResponse>(`/admin/users?${q.toString()}`)
}

export const updateUserCredits = (userId: string, payload: UpdateUserCreditsPayload) =>
  apiFetch<UpdateUserCreditsResponse>(`/admin/users/${encodeURIComponent(userId)}/credits`, {
    method: "PATCH",
    body: payload,
  })

export const deleteUser = (userId: string) =>
  apiFetch<DeleteUserResponse>(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  })

export const resetUserPassword = (userId: string, payload: ResetUserPasswordPayload) =>
  apiFetch<ResetUserPasswordResponse>(
    `/admin/users/${encodeURIComponent(userId)}/password`,
    {
      method: "PATCH",
      body: payload,
    },
  )

export const getCreditsUsageSeries = (days: number) =>
  apiFetch<CreditsUsageSeriesResponse>(`/admin/charts/credits-usage?days=${encodeURIComponent(days)}`)

export const getNewUsersSeries = (days: number) =>
  apiFetch<NewUsersSeriesResponse>(`/admin/charts/new-users?days=${encodeURIComponent(days)}`)
