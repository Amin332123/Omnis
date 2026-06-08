"use client"

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle, Eye, EyeOff, Loader2, Mail, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { ApiError, getApiErrorMessage } from "@/lib/api"
import { requestPasswordReset, resetPassword } from "@/lib/auth-api"

type StatusMessage = {
  type: "error" | "success"
  message: string
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset" | "done">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""])
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  useEffect(() => {
    if (resendTimer <= 0) return
    const id = window.setInterval(() => setResendTimer((value) => value - 1), 1000)
    return () => window.clearInterval(id)
  }, [resendTimer])

  const sendResetCode = async (nextEmail = email) => {
    const trimmedEmail = nextEmail.trim()
    if (!trimmedEmail) {
      setStatusMessage({ type: "error", message: "Enter your account email." })
      return
    }

    setStatusMessage(null)
    setIsSubmitting(true)
    try {
      await requestPasswordReset({ email: trimmedEmail })
      setEmail(trimmedEmail)
      setStep("reset")
      setResendTimer(60)
      setStatusMessage({
        type: "success",
        message: "If an account exists for that email, a reset code has been sent.",
      })
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: getApiErrorMessage(error, "Could not send a reset code."),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await sendResetCode()
  }

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = codeDigits.join("")

    if (code.length !== 6) {
      setStatusMessage({ type: "error", message: "Enter the full 6-digit code." })
      return
    }

    if (password.length < 8) {
      setStatusMessage({ type: "error", message: "Password must be at least 8 characters." })
      return
    }

    if (password !== confirmPassword) {
      setStatusMessage({ type: "error", message: "Passwords do not match." })
      return
    }

    setStatusMessage(null)
    setIsSubmitting(true)
    try {
      await resetPassword({ email, code, password })
      setPassword("")
      setConfirmPassword("")
      setCodeDigits(["", "", "", "", "", ""])
      setStep("done")
      setStatusMessage({ type: "success", message: "Password updated. You can sign in now." })
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setStatusMessage({ type: "error", message: "Invalid or expired reset code." })
      } else {
        setStatusMessage({
          type: "error",
          message: getApiErrorMessage(error, "Could not reset password."),
        })
      }
    } finally {
      setIsSubmitting(false)
    }
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

  const handleCodeKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const next = [...codeDigits]
    for (let i = 0; i < 6; i += 1) {
      next[i] = text[i] || ""
    }
    setCodeDigits(next)
    codeInputRefs.current[Math.min(text.length, 5)]?.focus()
  }

  const handleChangeEmail = () => {
    setStep("email")
    setStatusMessage(null)
    setCodeDigits(["", "", "", "", "", ""])
    setPassword("")
    setConfirmPassword("")
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
            {step === "email" ? (
              <motion.div
                key="email-header"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="text-2xl font-bold text-foreground mb-2">Reset password</h1>
                <p className="text-sm text-muted">Enter your email and we&apos;ll send a reset code.</p>
              </motion.div>
            ) : step === "reset" ? (
              <motion.div
                key="reset-header"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
                <p className="text-sm text-muted">
                  Enter the code sent to <span className="text-foreground font-medium">{email}</span>.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="done-header"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="text-2xl font-bold text-foreground mb-2">Password updated</h1>
                <p className="text-sm text-muted">Use your new password to sign in.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.form
              key="email-form"
              onSubmit={handleEmailSubmit}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl border border-border bg-card p-6 space-y-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Mail className="h-5 w-5" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {statusMessage ? (
                <p className={statusMessage.type === "error" ? "text-sm text-error" : "text-sm text-success"}>
                  {statusMessage.message}
                </p>
              ) : null}

              <Button className="w-full gap-2" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </motion.form>
          ) : step === "reset" ? (
            <motion.form
              key="reset-form"
              onSubmit={handleResetSubmit}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl border border-border bg-card p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Shield className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="ml-auto text-sm text-accent hover:underline"
                  disabled={isSubmitting}
                >
                  Change email
                </button>
              </div>

              <div className="space-y-2">
                <Label>Reset code</Label>
                <div className="grid grid-cols-6 gap-2">
                  {codeDigits.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(node) => {
                        codeInputRefs.current[index] = node
                      }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleCodeDigit(index, event.target.value)}
                      onKeyDown={(event) => handleCodeKeyDown(index, event)}
                      onPaste={handleCodePaste}
                      disabled={isSubmitting}
                      className="h-11 text-center text-base font-semibold"
                      aria-label={`Reset code digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a new password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {statusMessage ? (
                <p className={statusMessage.type === "error" ? "text-sm text-error" : "text-sm text-success"}>
                  {statusMessage.message}
                </p>
              ) : null}

              <Button className="w-full gap-2" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Update Password
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => sendResetCode()}
                disabled={isSubmitting || resendTimer > 0}
                className="w-full text-center text-sm text-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="done-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl border border-border bg-card p-6 space-y-4 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-success/10 text-success">
                <CheckCircle className="h-6 w-6" />
              </div>

              {statusMessage ? (
                <p className={statusMessage.type === "error" ? "text-sm text-error" : "text-sm text-success"}>
                  {statusMessage.message}
                </p>
              ) : null}

              <Button className="w-full gap-2" size="lg" onClick={() => router.push("/login")}>
                Go to Sign In
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
