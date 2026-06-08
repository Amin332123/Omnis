"use client"

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { ApiError, getApiErrorMessage } from "@/lib/api"

type StatusMessage = {
  type: "error" | "success"
  message: string
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const router = useRouter()
  const { login, user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage(null)
    setIsSubmitting(true)

    try {
      await login(formValues.email.trim(), formValues.password)
      setStatusMessage({
        type: "success",
        message: "Login successful. Redirecting to your dashboard...",
      })
      setFormValues((prev) => ({ ...prev, password: "" }))
      router.push("/dashboard")
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setStatusMessage({
          type: "error",
          message: "Invalid email or password.",
        })
        return
      }

      if (error instanceof ApiError && error.status === 400) {
        setStatusMessage({
          type: "error",
          message: error.message || "Validation failed.",
        })
        return
      }

      setStatusMessage({
        type: "error",
        message: getApiErrorMessage(error, "Login failed. Please try again."),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = event.target
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="Omnis Studio" className="h-8 w-8 object-contain" />
            <span className="text-lg font-semibold text-foreground">Omnis Studio</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-sm text-muted">Sign in to your account to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={formValues.email}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={formValues.password}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formValues.rememberMe}
                onChange={handleChange}
                className="rounded border-border"
                disabled={isSubmitting}
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-sm text-accent hover:underline">
              Forgot password?
            </Link>
          </div>

          {statusMessage ? (
            <p
              className={
                statusMessage.type === "error" ? "text-sm text-error" : "text-sm text-success"
              }
            >
              {statusMessage.message}
            </p>
          ) : null}

          <Button className="w-full gap-2" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-accent hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
