declare global {
  interface Window {
    Paddle?: {
      Checkout: {
        open: (options: PaddleCheckoutOptions) => Promise<PaddleEventData>
      }
      Initialize: (options: { token: string; environment?: string }) => Promise<void>
    }
  }
}

export type PaddleCheckoutOptions = {
  items: Array<{ priceId: string; quantity: number }>
  customData?: Record<string, string | number | boolean>
  settings?: {
    displayMode?: "overlay" | "inline"
    theme?: "light" | "dark"
    successUrl?: string
  }
  eventCallback?: (event: PaddleEvent) => void
}

type PaddleEvent = {
  name: string
  data?: Record<string, unknown>
}

type PaddleEventData = {
  id: string
  status: string
  [key: string]: unknown
}

const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
const PADDLE_ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "sandbox"
const PADDLE_SCRIPT_URL = "https://cdn.paddle.com/paddle/v2/paddle.js"

function loadPaddleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Not in browser"))
      return
    }
    if (document.querySelector(`script[src="${PADDLE_SCRIPT_URL}"]`)) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = PADDLE_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Paddle.js"))
    document.head.appendChild(script)
  })
}

function waitForPaddle(timeoutMs = 10000): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (window.Paddle) return Promise.resolve(true)

  return new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      if (window.Paddle) {
        resolve(true)
        return
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(false)
        return
      }
      setTimeout(check, 100)
    }
    check()
  })
}

export async function initPaddle(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!PADDLE_CLIENT_TOKEN) {
    console.error("Paddle client token not configured")
    return false
  }

  const scriptLoaded = await loadPaddleScript().then(() => true).catch(() => false)
  if (!scriptLoaded) {
    console.error("Failed to load Paddle.js")
    return false
  }

  const loaded = await waitForPaddle()
  if (!loaded) {
    console.error("Paddle.js loaded but Paddle global not found")
    return false
  }

  try {
    await window.Paddle!.Initialize({
      token: PADDLE_CLIENT_TOKEN,
      environment: PADDLE_ENVIRONMENT,
    })
    return true
  } catch (err) {
    console.error("Paddle.Initialize failed", err)
    return false
  }
}

export async function openPaddleCheckout(options: PaddleCheckoutOptions): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!window.Paddle) {
    console.error("Paddle.js not initialized")
    return false
  }

  try {
    await window.Paddle!.Checkout.open({
      ...options,
      eventCallback: (event: { name: string; data?: Record<string, unknown> }) => {
        console.log("[Paddle event]", event.name, event.data)
        if (event.name === "checkout.failed" || event.name === "checkout.error") {
          console.error("[Paddle error]", event.data)
        }
      },
    })
    return true
  } catch (err) {
    console.error("Paddle checkout failed", err)
    return false
  }
}
