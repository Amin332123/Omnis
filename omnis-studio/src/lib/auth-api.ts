import { apiFetch, getStoredToken } from "@/lib/api"

export type AuthUserResponse = {
  id: string
  email: string
  credits: number
  avatarUrl?: string | null
  emailNotifications?: boolean
  marketingEmails?: boolean
  createdAt: string
  isAdmin?: boolean
}

export type LoginResponse = {
  accessToken: string
}

export type RegisterResponse = {
  id: string
  email: string
  credits: number
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  email: string
  password: string
}

export type SendVerificationCodePayload = {
  email: string
  password: string
}

export type VerifyCodePayload = {
  email: string
  code: string
}

export type RequestPasswordResetPayload = {
  email: string
}

export type ResetPasswordPayload = {
  email: string
  code: string
  password: string
}

export const login = (payload: LoginPayload) =>
  apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
    auth: false,
  })

export const register = (payload: RegisterPayload) =>
  apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: payload,
    auth: false,
  })

export const sendVerificationCode = (payload: SendVerificationCodePayload) =>
  apiFetch<{ success: boolean }>("/auth/send-verification-code", {
    method: "POST",
    body: payload,
    auth: false,
  })

export const verifyAndRegister = (payload: VerifyCodePayload) =>
  apiFetch<LoginResponse>("/auth/verify-and-register", {
    method: "POST",
    body: payload,
    auth: false,
  })

export const requestPasswordReset = (payload: RequestPasswordResetPayload) =>
  apiFetch<{ success: boolean }>("/auth/request-password-reset", {
    method: "POST",
    body: payload,
    auth: false,
  })

export const resetPassword = (payload: ResetPasswordPayload) =>
  apiFetch<{ success: boolean }>("/auth/reset-password", {
    method: "POST",
    body: payload,
    auth: false,
  })

export const getCurrentUser = () => apiFetch<AuthUserResponse>("/auth/me")

export const updateNotificationPrefs = (prefs: { emailNotifications?: boolean; marketingEmails?: boolean }) =>
  apiFetch<{ success: boolean }>("/auth/notifications", {
    method: "PATCH",
    body: prefs,
  })

export const deleteAccount = () =>
  apiFetch<{ success: boolean }>("/auth/account", {
    method: "DELETE",
  })

export const uploadAvatar = (file: File) => {
  const token = getStoredToken()
  const formData = new FormData()
  formData.append("avatar", file)

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
  return fetch(`${baseUrl}/auth/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.message ?? "Upload failed")
    }
    return res.json() as Promise<{ avatarUrl: string }>
  })
}
