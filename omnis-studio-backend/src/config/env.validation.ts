type EnvConfig = {
  FAL_API_KEY: string
  OPENAI_API_KEY: string
  JWT_SECRET: string
  DATABASE_URL: string
  PADDLE_API_KEY: string
  PADDLE_WEBHOOK_SECRET: string
  PADDLE_ENVIRONMENT?: "sandbox" | "production"
  FRONTEND_URL?: string
  RESEND_API_KEY?: string
  MAIL_FROM_ADDRESS?: string
  MAIL_FROM_NAME?: string
  PORT?: string
  RATE_LIMIT_TTL?: string
  RATE_LIMIT_LIMIT?: string
  ADMIN_EMAIL?: string
  ADMIN_PASSWORD?: string
}

const REQUIRED_KEYS: Array<keyof EnvConfig> = [
  "FAL_API_KEY",
  "OPENAI_API_KEY",
  "JWT_SECRET",
  "DATABASE_URL",
  "PADDLE_API_KEY",
  "PADDLE_WEBHOOK_SECRET",
]

const OPTIONAL_NUMBER_KEYS: Array<keyof EnvConfig> = ["RATE_LIMIT_TTL", "RATE_LIMIT_LIMIT"]
const OPTIONAL_STRING_KEYS: Array<keyof EnvConfig> = [
  "FRONTEND_URL",
  "RESEND_API_KEY",
  "MAIL_FROM_ADDRESS",
  "MAIL_FROM_NAME",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "PADDLE_ENVIRONMENT",
]

export const validateEnvironment = (config: Record<string, unknown>) => {
  for (const key of REQUIRED_KEYS) {
    const value = config[key]
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`${key} is required to start the server`)
    }
  }

  for (const key of OPTIONAL_NUMBER_KEYS) {
    const value = config[key]
    if (value === undefined || value === null || value === "") continue
    if (Number.isNaN(Number(value))) {
      throw new Error(`${key} must be a number`)
    }
  }

  for (const key of OPTIONAL_STRING_KEYS) {
    const value = config[key]
    if (value === undefined || value === null) continue
    if (typeof value !== "string") {
      throw new Error(`${key} must be a string`)
    }
  }

  const adminEmail = config.ADMIN_EMAIL
  const adminPassword = config.ADMIN_PASSWORD
  const adminEmailSet = typeof adminEmail === "string" && adminEmail.trim().length > 0
  const adminPasswordSet =
    typeof adminPassword === "string" && adminPassword.trim().length > 0

  if (adminEmailSet !== adminPasswordSet) {
    throw new Error("Both ADMIN_EMAIL and ADMIN_PASSWORD must be set together")
  }

  return config
}
