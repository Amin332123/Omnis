"use client"

import { motion } from "framer-motion"
import { Image, Video, Sparkles, Layers, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Stat } from "@/lib/types"

const iconMap: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  image: Image,
  video: Video,
  layers: Layers,
}

interface StatCardProps {
  stat: Stat
  index: number
}

export function StatCard({ stat, index }: StatCardProps) {
  const Icon = iconMap[stat.icon] || Sparkles

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/30"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted font-medium">{stat.label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</span>
        {stat.trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              stat.trend > 0 ? "text-success" : "text-error"
            )}
          >
            {stat.trend > 0 ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {Math.abs(stat.trend)}%
          </span>
        )}
      </div>
    </motion.div>
  )
}
