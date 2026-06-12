declare global {
  interface Window {
    Paddle: {
      Checkout: {
        open: (options: PaddleCheckoutOptions) => void
      }
      Environment: {
        set: (environment: string) => void
      }
      Init: (options: { token: string }) => void
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

const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
const PADDLE_ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "sandbox"

export function initPaddle(): void {
  if (typeof window === "undefined") return
  if (!window.Paddle) return

  window.Paddle.Environment.set(PADDLE_ENVIRONMENT)
  window.Paddle.Init({ token: PADDLE_CLIENT_TOKEN ?? "" })
}

export function openPaddleCheckout(options: PaddleCheckoutOptions): void {
  if (typeof window === "undefined") return

  if (!window.Paddle) {
    console.error("Paddle.js not loaded")
    return
  }

  window.Paddle.Checkout.open(options)
}
