"use client"

import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCredits } from "@/lib/credit-cost"

interface CreditBadgeProps {
  credits: number
  className?: string
  compact?: boolean
}

export function CreditBadge({ credits, className, compact }: CreditBadgeProps) {
  const isLow = credits < 2

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border transition-colors",
        compact
          ? "px-2 py-1 text-xs"
          : "px-3 py-1.5 text-sm font-medium",
        isLow
          ? "border-warning/30 bg-warning/10 text-warning"
          : "border-accent/20 bg-accent/5 text-accent hover:bg-accent/10",
        className
      )}
    >
      <Zap className={cn("text-warning", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span className={cn("font-semibold", isLow ? "text-warning" : "text-foreground")}>
        {formatCredits(credits)}
      </span>
      {!compact && <span className="text-muted">credits</span>}
    </div>
  )
}
