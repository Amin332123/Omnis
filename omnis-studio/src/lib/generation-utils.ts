const GRADIENT_PALETTES = [
  { from: "#6366f1", to: "#8b5cf6" },
  { from: "#f59e0b", to: "#ef4444" },
  { from: "#10b981", to: "#059669" },
  { from: "#3b82f6", to: "#06b6d4" },
  { from: "#ec4899", to: "#f43f5e" },
  { from: "#8b5cf6", to: "#ec4899" },
  { from: "#f97316", to: "#f59e0b" },
  { from: "#14b8a6", to: "#10b981" },
  { from: "#6366f1", to: "#3b82f6" },
  { from: "#a855f7", to: "#6366f1" },
]

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export const getGradientFromPrompt = (prompt: string, seedOffset = 0) => {
  const palette = GRADIENT_PALETTES[(hashString(prompt) + seedOffset) % GRADIENT_PALETTES.length]
  return { gradientFrom: palette.from, gradientTo: palette.to }
}
