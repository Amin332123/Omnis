"use client"

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { AnimatedBackground } from "@/components/shared/animated-background"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { ApiError, getApiErrorMessage } from "@/lib/api"

type StatusMessage = {
  type: "error" | "success"
  message: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const router = useRouter()
  const { login, user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user?.isEmailVerified) {
      router.replace("/dashboard")
    } else if (!isLoading && user && !user.isEmailVerified) {
      router.replace("/verify-email")
    }
  }, [isLoading, user, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage(null)
    setIsSubmitting(true)

    try {
      const result = await login(formValues.email.trim(), formValues.password)
      if (!result.isEmailVerified) {
        router.push("/verify-email")
        return
      }
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
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      <AnimatedBackground />

      <div className="absolute top-4 right-4 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <ThemeToggle />
        </motion.div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm relative"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <img src="/logo.png" alt="Omnis Studio" className="h-8 w-8 object-contain" />
            </motion.div>
            <motion.span className="text-lg font-semibold text-foreground">Omnis Studio</motion.span>
          </Link>
          <motion.h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            Welcome back
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <Sparkles className="h-5 w-5 text-accent" />
            </motion.span>
          </motion.h1>
          <p className="text-sm text-muted">Sign in to your account to continue</p>
        </motion.div>

        <motion.div variants={scaleVariants}>
          <motion.form
            onSubmit={handleSubmit}
            className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 space-y-4 overflow-hidden group"
            whileHover={{ boxShadow: "0 8px 40px rgba(99,102,241,0.08)" }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99,102,241,0.06), transparent 40%)",
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                e.currentTarget.style.setProperty("--mouse-x", `${((e.clientX - rect.left) / rect.width) * 100}%`)
                e.currentTarget.style.setProperty("--mouse-y", `${((e.clientY - rect.top) / rect.height) * 100}%`)
              }}
            />

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
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
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="pl-10 transition-all duration-300 border-border/50 focus:border-accent bg-background/50"
                />
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-accent rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: focusedField === "email" ? "100%" : "0%" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none z-10" />
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
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="pl-10 pr-10 transition-all duration-300 border-border/50 focus:border-accent bg-background/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  <motion.div
                    animate={{ rotate: showPassword ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </motion.div>
                </button>
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-accent rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: focusedField === "password" ? "100%" : "0%" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer group">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formValues.rememberMe}
                    onChange={handleChange}
                    className="rounded border-border accent-accent"
                    disabled={isSubmitting}
                  />
                </motion.div>
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-accent hover:underline font-medium relative group">
                Forgot password?
                <motion.span
                  className="absolute -bottom-0.5 left-0 h-0.5 bg-accent"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            </motion.div>

            {statusMessage ? (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p
                  className={
                    statusMessage.type === "error"
                      ? "text-sm text-error flex items-center gap-1.5"
                      : "text-sm text-success flex items-center gap-1.5"
                  }
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {statusMessage.type === "error" ? "•" : "✓"}
                  </motion.span>
                  {statusMessage.message}
                </p>
              </motion.div>
            ) : null}

            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                <Button
                  className="w-full gap-2 relative overflow-hidden group/btn"
                  size="lg"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                    initial={{ x: "-100%" }}
                    animate={!isSubmitting ? { x: ["100%", "-100%"] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                  />
                  {isSubmitting ? (
                    <motion.span
                      className="flex items-center gap-2"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-flex"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.span>
                      Signing in...
                    </motion.span>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>

            <motion.p variants={itemVariants} className="text-center text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-accent hover:underline font-medium relative group inline-flex items-center gap-0.5">
                Sign up
                <motion.span
                  className="absolute -bottom-0.5 left-0 h-0.5 bg-accent"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            </motion.p>
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  )
}
