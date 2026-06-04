"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ModelCardProps {
  selected: boolean
  onClick: () => void
  label: string
  description: string
  quality: string
  speed: string
}

export function ModelCard({ selected, onClick, label, description, quality, speed }: ModelCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "relative w-full text-left rounded-xl border p-4 transition-all duration-200",
        selected
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border bg-card hover:border-accent/30 hover:bg-card-hover"
      )}
    >
      {selected && (
        <motion.div
          layoutId="model-select"
          className="absolute inset-0 rounded-xl border-2 border-accent"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className="relative">
        <h3 className={cn("text-sm font-semibold mb-1", selected ? "text-accent" : "text-foreground")}>
          {label}
        </h3>
        <p className="text-xs text-muted mb-3">{description}</p>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className={cn("h-1.5 w-1.5 rounded-full", selected ? "bg-accent" : "bg-success")} />
            <span className="text-muted">{quality}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn("h-1.5 w-1.5 rounded-full", selected ? "bg-accent" : "bg-warning")} />
            <span className="text-muted">{speed}</span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
