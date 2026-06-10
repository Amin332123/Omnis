"use client"

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Eye, EyeOff, Mail, Shield, CheckCircle, Loader2, Sparkles, User, Lock } from "lucide-react"
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
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.25 },
  },
}

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "code">("form")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
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
            <span className="text-lg font-semibold text-foreground">Omnis Studio</span>
          </Link>
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form-header"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                  Create an account
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <Sparkles className="h-5 w-5 text-accent" />
                  </motion.span>
                </h1>
                <p className="text-sm text-muted">Get started with your free trial</p>
              </motion.div>
            ) : (
              <motion.div
                key="code-header"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
                <p className="text-sm text-muted">
                  We sent a 6-digit code to{" "}
                  <span className="text-foreground font-medium">{formValues.email}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 space-y-4 overflow-hidden group"
              whileHover={{ boxShadow: "0 8px 40px rgba(99,102,241,0.08)" }}
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
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none z-10" />
                  <Input
                    id="name"
                    name="fullName"
                    type="text"
                    placeholder="Alex Morgan"
                    autoComplete="name"
                    value={formValues.fullName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 transition-all duration-300 border-border/50 focus:border-accent bg-background/50"
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-accent rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: focusedField === "name" ? "100%" : "0%" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none z-10" />
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
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={8}
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

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none z-10" />
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
                    onFocus={() => setFocusedField("confirm")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 pr-10 transition-all duration-300 border-border/50 focus:border-accent bg-background/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  >
                    <motion.div
                      animate={{ rotate: showConfirm ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </motion.div>
                  </button>
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-accent rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: focusedField === "confirm" ? "100%" : "0%" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
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
                          <Loader2 className="h-4 w-4" />
                        </motion.span>
                        Sending code...
                      </motion.span>
                    ) : (
                      <>
                        Send verification code
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              <motion.p variants={itemVariants} className="text-center text-sm text-muted">
                Already have an account?{" "}
                <Link href="/login" className="text-accent hover:underline font-medium relative group inline-flex items-center gap-0.5">
                  Sign in
                  <motion.span
                    className="absolute -bottom-0.5 left-0 h-0.5 bg-accent"
                    initial={{ width: 0 }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.2 }}
                  />
                </Link>
              </motion.p>
            </motion.form>
          ) : (
            <motion.div
              key="code"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 space-y-6 overflow-hidden group"
              whileHover={{ boxShadow: "0 8px 40px rgba(99,102,241,0.08)" }}
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

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-accent" />
                  <span className="text-sm text-muted">Enter the code sent to your email</span>
                </div>
                <div className="flex justify-center gap-2">
                  {codeDigits.map((digit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 + i * 0.05 }}
                    >
                      <input
                        ref={(el) => { codeInputRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeDigit(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        onPaste={i === 0 ? handleCodePaste : undefined}
                        disabled={isSubmitting}
                        className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-border/50 bg-background/50 text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all duration-300 disabled:opacity-50"
                      />
                    </motion.div>
                  ))}
                </div>
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
                        ? "text-sm text-error text-center flex items-center justify-center gap-1.5"
                        : "text-sm text-success text-center flex items-center justify-center gap-1.5"
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

              <div className="space-y-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    className="w-full gap-2 relative overflow-hidden group/btn"
                    size="lg"
                    onClick={() => void handleVerifyCode()}
                    disabled={isSubmitting || codeDigits.join("").length !== 6}
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
                          <Shield className="h-4 w-4" />
                        </motion.span>
                        Verifying...
                      </motion.span>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Verify & Create Account
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.div
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {resendTimer > 0 ? (
                    <motion.p
                      className="text-sm text-muted"
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Resend code in <span className="text-foreground font-medium">{resendTimer}s</span>
                    </motion.p>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={() => void handleResendCode()}
                      disabled={isSubmitting}
                      className="text-sm text-accent hover:underline font-medium disabled:opacity-50 relative group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Resend code
                      <motion.span
                        className="absolute -bottom-0.5 left-0 h-0.5 bg-accent"
                        initial={{ width: 0 }}
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.button>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <button
                    type="button"
                    onClick={handleBackToForm}
                    disabled={isSubmitting}
                    className="w-full text-center text-sm text-muted hover:text-foreground transition-colors disabled:opacity-50 group"
                  >
                    <motion.span
                      className="inline-flex items-center gap-1"
                      whileHover={{ x: -2 }}
                    >
                      ← Use a different email
                    </motion.span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
