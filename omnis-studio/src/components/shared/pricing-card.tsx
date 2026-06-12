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
  disabled?: boolean
}

export function PricingCard({ pack, onSelect, className, selected, disabled }: PricingCardProps) {
  return (
    <div className="relative">
      {pack.popular && (
        <div
          className="absolute -inset-[1.5px] rounded-2xl opacity-60"
          style={{
            background: "conic-gradient(from 0deg, #4f46e5, #8b5cf6, #ec4899, #4f46e5)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            padding: "1.5px",
          }}
        >
          <div className="absolute inset-0 rounded-2xl animate-gradient-rotate"
            style={{
              background: "conic-gradient(from 0deg, #4f46e5, #8b5cf6, #ec4899, #4f46e5)",
            }}
          />
        </div>
      )}

      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative rounded-2xl border border-border bg-card p-10 transition-colors overflow-hidden",
          pack.popular && "border-transparent shadow-lg shadow-accent/20",
          selected && "ring-2 ring-accent",
          className
        )}
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/3 via-transparent to-transparent animate-bg-shimmer" />

        <div className="relative z-10">
          {pack.popular && (
            <div className="flex justify-center -mt-14 mb-6">
              <span className="inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground shadow-lg shadow-accent/20">
                Most Popular
              </span>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-2">{pack.name}</h3>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-bold text-foreground">$</span>
              <span className="text-5xl font-bold text-foreground">{pack.price}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <Zap className="h-5 w-5 text-warning" />
              <p className="text-base text-muted">
                <span className="font-semibold text-foreground">{pack.credits}</span> credits
              </p>
            </div>
          </div>

          <ul className="space-y-4 mb-10">
            {(pack.features?.length ? pack.features : [
              `${pack.credits} credits to use anytime`,
              "Credits never expire",
              "Generate images & videos",
            ]).map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <span className="text-base text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            variant={pack.popular ? "default" : "outline"}
            className="w-full h-12 text-base"
            size="lg"
            onClick={() => onSelect?.(pack.id)}
            disabled={disabled || !pack.paddlePriceId}
          >
            {disabled ? "Processing..." : `Buy ${pack.credits} Credits`}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
