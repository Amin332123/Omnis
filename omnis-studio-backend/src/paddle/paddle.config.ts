export const PADDLE_PRODUCT_MAP: Record<string, { name: string; credits: number; price: number }> = {
  pri_01kty77r9kb063d99s3pdkdkyc: { name: "Starter Pack", credits: 300, price: 29 },
  pri_01kty7krpry1p3m9sft9styf0c: { name: "Pro Pack", credits: 1000, price: 79 },
  pri_01kty7mw8jtfbx5e2dyqbxarrc: { name: "Pro Max Pack", credits: 2000, price: 149 },
}

export const CREDITS_PER_PURCHASE_MIN = 1
export const CREDITS_PER_PURCHASE_MAX = 100000

export const PADDLE_EVENTS = {
  TRANSACTION_COMPLETED: "transaction.completed",
  TRANSACTION_REFUNDED: "transaction.refunded",
  TRANSACTION_CANCELED: "transaction.canceled",
  TRANSACTION_PAID: "transaction.paid",
} as const
