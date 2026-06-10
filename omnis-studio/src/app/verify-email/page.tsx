import { Suspense } from "react"
import { VerifyEmailContent } from "./verify-email-content"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="relative min-h-screen flex items-center justify-center p-4" />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
