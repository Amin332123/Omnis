declare global {
  interface Window {
    Paddle: {
      Checkout: {
        open: (options: PaddleCheckoutOptions) => Promise<PaddleEventData>
      }
      Init: (options: { token: string; environment?: string }) => Promise<void>
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
}

type PaddleEventData = {
  id: string
  status: string
  [key: string]: unknown
}

const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
const PADDLE_ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "sandbox"

let paddleInitPromise: Promise<void> | null = null

export function initPaddle(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (!window.Paddle) {
    console.error("Paddle.js not loaded")
    return Promise.resolve()
  }
  if (paddleInitPromise) return paddleInitPromise

  paddleInitPromise = window.Paddle.Init({
    token: PADDLE_CLIENT_TOKEN ?? "",
    environment: PADDLE_ENVIRONMENT,
  }).catch((err) => {
    console.error("Paddle.Init failed", err)
    paddleInitPromise = null
  })

  return paddleInitPromise
}

export async function openPaddleCheckout(options: PaddleCheckoutOptions): Promise<void> {
  if (typeof window === "undefined") return

  if (!window.Paddle) {
    console.error("Paddle.js not loaded")
    return
  }

  try {
    await window.Paddle.Checkout.open(options)
  } catch (err) {
    console.error("Paddle checkout failed", err)
  }
}
