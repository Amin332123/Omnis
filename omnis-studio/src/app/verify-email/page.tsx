"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mail, CheckCircle, Loader2, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { AnimatedBackground } from "@/components/shared/animated-background"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { ApiError, getApiErrorMessage } from "@/lib/api"

type PageStep = "idle" | "verifying" | "verified" | "error" | "sending"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
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

export default function VerifyEmailPage() {
  const [step, setStep] = useState<PageStep>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { user, isLoading, verifyEmailToken, resendVerification } = useAuth()

  useEffect(() => {
    if (!isLoading && user?.isEmailVerified) {
      setStep("verified")
    }
  }, [isLoading, user])

  useEffect(() => {
    if (token) {
      setStep("verifying")
      verifyEmailToken(token)
        .then(() => {
          setStep("verified")
          setTimeout(() => router.push("/login"), 3000)
        })
        .catch((err) => {
          setErrorMessage(getApiErrorMessage(err, "Invalid or expired verification link."))
          setStep("error")
        })
    }
  }, [token, verifyEmailToken, router])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const handleResend = async () => {
    setErrorMessage("")
    setStep("sending")
    try {
      await resendVerification()
      setResendCooldown(60)
      setStep("idle")
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, "Failed to resend verification email."))
      setStep("error")
    }
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <AnimatedBackground />
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    )
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
          {step === "verifying" && (
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Verifying your email</h1>
              <p className="text-sm text-muted">Please wait while we verify your email address...</p>
            </div>
          )}
          {step === "verified" && (
            <div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="h-8 w-8 text-green-500" />
              </motion.div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Email verified</h1>
              <p className="text-sm text-muted">
                Your email has been successfully verified. You can now log in and start using Omnis Studio.
              </p>
            </div>
          )}
          {step === "error" && !token && (
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                Check your inbox
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <Sparkles className="h-5 w-5 text-accent" />
                </motion.span>
              </h1>
              <p className="text-sm text-muted">
                We sent a verification link to <span className="text-foreground font-medium">{user?.email || "your email"}</span>.
                Click the link to activate your account.
              </p>
            </div>
          )}
          {step === "idle" && (
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                Check your inbox
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <Sparkles className="h-5 w-5 text-accent" />
                </motion.span>
              </h1>
              <p className="text-sm text-muted">
                We sent a verification link to <span className="text-foreground font-medium">{user?.email || "your email"}</span>.
                Click the link to activate your account.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 space-y-4"
        >
          {step === "verifying" && (
            <div className="flex justify-center py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-8 w-8 text-accent" />
              </motion.div>
            </div>
          )}

          {step === "verified" && (
            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => router.push("/login")}
                >
                  Go to login
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          )}

          {(step === "idle" || (step === "error" && !token) || step === "sending") && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <Mail className="h-4 w-4" />
                <span>Didn&apos;t receive the email?</span>
              </div>

              {errorMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-error text-center"
                >
                  {errorMessage}
                </motion.p>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || step === "sending"}
                >
                  {step === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    "Resend verification email"
                  )}
                </Button>
              </motion.div>

              <p className="text-center text-sm text-muted">
                Already verified?{" "}
                <Link href="/login" className="text-accent hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {step === "error" && token && (
            <div className="space-y-4">
              <p className="text-sm text-error text-center">{errorMessage}</p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleResend}
                >
                  Resend verification email
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>

        <motion.p variants={itemVariants} className="text-center text-sm text-muted mt-6">
          <Link href="mailto:support@omnis-studio.com" className="text-accent hover:underline font-medium">
            Contact support
          </Link>{" "}
          if you need help.
        </motion.p>
      </motion.div>
    </div>
  )
}
