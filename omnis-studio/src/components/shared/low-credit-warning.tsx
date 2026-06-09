"use client"

import { AlertTriangle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatCredits } from "@/lib/credit-cost"

interface LowCreditWarningProps {
  credits: number
  className?: string
}

export function LowCreditWarning({ credits, className }: LowCreditWarningProps) {
  if (credits > 0) return null

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 p-4",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
        <AlertTriangle className="h-5 w-5 text-warning" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {credits === 0 ? "No credits remaining" : `Only ${formatCredits(credits)} credit${credits !== 1 ? "s" : ""} remaining`}
        </p>
        <p className="text-xs text-muted">
          Buy more credits to continue generating content
        </p>
      </div>
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-1.5 rounded-lg bg-warning/20 px-3 py-2 text-xs font-semibold text-warning hover:bg-warning/30 transition-colors shrink-0"
      >
        <Zap className="h-3.5 w-3.5" />
        Buy Credits
      </Link>
    </div>
  )
}
