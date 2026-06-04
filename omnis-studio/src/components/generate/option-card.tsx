"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface OptionCardProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

export function OptionCard({ selected, onClick, children, className }: OptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200",
        selected
          ? "border-accent bg-accent/5 text-accent shadow-sm"
          : "border-border bg-card text-muted hover:border-accent/30 hover:text-foreground hover:bg-card-hover",
        className
      )}
    >
      {selected && (
        <motion.div
          layoutId="option-select"
          className="absolute inset-0 rounded-xl border-2 border-accent"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      {children}
    </motion.button>
  )
}
