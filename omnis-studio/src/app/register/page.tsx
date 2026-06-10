"use client"

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Eye, EyeOff, Mail, Shield, CheckCircle, Loader2 } from "lucide-react"
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

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "code">("form")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)
  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""])
  const [resendTimer, setResendTimer] = useState(0)
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { sendVerificationCode, verifyAndRegister, user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  const handleSendCode = async () => {
    setStatusMessage(null)

    if (formValues.password.length < 8) {
      setStatusMessage({ type: "error", message: "Password must be at least 8 characters." })
      return
    }

    if (formValues.password !== formValues.confirmPassword) {
      setStatusMessage({ type: "error", message: "Passwords do not match." })
      return
    }

    setIsSubmitting(true)
    try {
      await sendVerificationCode(formValues.email.trim(), formValues.password)
      setStep("code")
      setResendTimer(60)
      setStatusMessage({ type: "success", message: "Verification code sent to your email." })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setStatusMessage({ type: "error", message: "Email already exists." })
      } else {
        setStatusMessage({ type: "error", message: getApiErrorMessage(error, "Failed to send code.") })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleSendCode()
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return
    setStatusMessage(null)
    setIsSubmitting(true)
    try {
      await sendVerificationCode(formValues.email.trim(), formValues.password)
      setResendTimer(60)
      setStatusMessage({ type: "success", message: "New code sent." })
    } catch {
      setStatusMessage({ type: "error", message: "Failed to resend code." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async () => {
    const code = codeDigits.join("")
    if (code.length !== 6) {
      setStatusMessage({ type: "error", message: "Please enter the full 6-digit code." })
      return
    }

    setStatusMessage(null)
    setIsSubmitting(true)
    try {
      await verifyAndRegister(formValues.email.trim(), code)
      setStatusMessage({ type: "success", message: "Account created! Redirecting..." })
      router.push("/dashboard")
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setStatusMessage({ type: "error", message: "Wrong code. Please check and try again." })
      } else {
        setStatusMessage({ type: "error", message: getApiErrorMessage(error, "Verification failed.") })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleCodeDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...codeDigits]
    next[index] = value
    setCodeDigits(next)
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const next = [...codeDigits]
    for (let i = 0; i < 6; i++) {
      next[i] = text[i] || ""
    }
    setCodeDigits(next)
    const focusIdx = Math.min(text.length, 5)
    codeInputRefs.current[focusIdx]?.focus()
  }

  const handleBackToForm = () => {
    setStep("form")
    setStatusMessage(null)
    setCodeDigits(["", "", "", "", "", ""])
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
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form-header"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold text-foreground mb-2">Create an account</h1>
                <p className="text-sm text-muted">Get started with your free trial</p>
              </motion.div>
            ) : (
              <motion.div
                key="code-header"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
                <p className="text-sm text-muted">
                  We sent a 6-digit code to{" "}
                  <span className="text-foreground font-medium">{formValues.email}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-border bg-card p-6 space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="fullName"
                  type="text"
                  placeholder="Alex Morgan"
                  autoComplete="name"
                  value={formValues.fullName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

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
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={8}
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

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    minLength={8}
                    value={formValues.confirmPassword}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {statusMessage ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    statusMessage.type === "error"
                      ? "text-sm text-error"
                      : "text-sm text-success"
                  }
                >
                  {statusMessage.message}
                </motion.p>
              ) : null}

              <Button className="w-full gap-2" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Send verification code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted">
                Already have an account?{" "}
                <Link href="/login" className="text-accent hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </motion.form>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-border bg-card p-6 space-y-6"
            >
              <div className="flex justify-center gap-2">
                {codeDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeInputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeDigit(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    onPaste={i === 0 ? handleCodePaste : undefined}
                    disabled={isSubmitting}
                    className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-border bg-background text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors disabled:opacity-50"
                  />
                ))}
              </div>

              {statusMessage ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    statusMessage.type === "error"
                      ? "text-sm text-error text-center"
                      : "text-sm text-success text-center"
                  }
                >
                  {statusMessage.message}
                </motion.p>
              ) : null}

              <div className="space-y-3">
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => void handleVerifyCode()}
                  disabled={isSubmitting || codeDigits.join("").length !== 6}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Verify & Create Account
                    </>
                  )}
                </Button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-muted">
                      Resend code in <span className="text-foreground font-medium">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleResendCode()}
                      disabled={isSubmitting}
                      className="text-sm text-accent hover:underline font-medium disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleBackToForm}
                  disabled={isSubmitting}
                  className="w-full text-center text-sm text-muted hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Use a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
