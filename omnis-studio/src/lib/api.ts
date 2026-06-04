export const TOKEN_STORAGE_KEY = "auth_token"

export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not set")
}

const apiBaseUrlSafe: string = apiBaseUrl

const normalizeBaseUrl = (base: string) => base.replace(/\/$/, "")
const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`)

export const getStoredToken = () => {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export const setStoredToken = (token: string) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export const clearStoredToken = () => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

type ApiRequestOptions = {
  method?: string
  body?: unknown
  headers?: HeadersInit
  auth?: boolean
}

const parseErrorMessage = (data: unknown, fallback: string) => {
  if (!data || typeof data !== "object") return fallback
  if (Array.isArray((data as { message?: unknown }).message)) {
    return (data as { message: string[] }).message.join(", ")
  }
  if (typeof (data as { message?: unknown }).message === "string") {
    return (data as { message: string }).message
  }
  return fallback
}

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong.") => {
  if (error instanceof ApiError) {
    if (error.status === 0) return "Could not reach the server. Please try again."
    if (error.status === 401) return "Your session has expired. Please sign in again."
    if (error.status === 402) return error.message || "Insufficient credits to complete this action."
    if (error.status === 409) return "This resource already exists."
    if (error.status >= 500) return "Server error. Please try again shortly."
    return error.message || fallback
  }
  return fallback
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}) {
  const url = `${normalizeBaseUrl(apiBaseUrlSafe)}${normalizePath(path)}`
  const headers = new Headers(options.headers)

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  if (options.auth !== false) {
    const token = getStoredToken()
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  try {
    const response = await fetch(url, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })

    const contentType = response.headers.get("content-type") ?? ""
    const isJson = contentType.includes("application/json")

    let data: unknown = null
    if (response.status !== 204) {
      if (isJson) {
        data = await response.json()
      } else {
        data = await response.text()
      }
    }

    if (!response.ok) {
      const message = parseErrorMessage(data, response.statusText || "Request failed")
      throw new ApiError(response.status, message, data)
    }

    return data as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, "Network error", error)
  }
}
