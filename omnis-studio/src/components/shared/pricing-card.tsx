"use client"

import { motion } from "framer-motion"
import { Check, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { type CreditPack } from "@/lib/types"

interface PricingCardProps {
  pack: CreditPack
  onSelect?: (packId: string) => void
  className?: string
  selected?: boolean
}

export function PricingCard({ pack, onSelect, className, selected }: PricingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-2xl border border-border bg-card p-8 transition-colors",
        pack.popular && "border-accent shadow-lg shadow-accent/10",
        selected && "ring-2 ring-accent",
        className
      )}
    >
      {pack.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">{pack.name}</h3>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-bold text-foreground">$</span>
          <span className="text-4xl font-bold text-foreground">{pack.price}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <Zap className="h-4 w-4 text-warning" />
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">{pack.credits}</span> credits
          </p>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {(pack.features?.length ? pack.features : [
          `${pack.credits} credits to use anytime`,
          "Credits never expire",
          "Generate images & videos",
        ]).map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <span className="text-sm text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={pack.popular ? "default" : "outline"}
        className="w-full"
        size="lg"
        onClick={() => onSelect?.(pack.id)}
      >
        Buy {pack.credits} Credits
      </Button>
    </motion.div>
  )
}
