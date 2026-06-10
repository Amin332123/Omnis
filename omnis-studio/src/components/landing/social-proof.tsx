"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Image, Loader2 } from "lucide-react"

interface PublicGeneration {
  id: string
  imageUrl: string
  prompt: string
  model: string
}

const testimonials = [
  {
    initials: "SK",
    name: "Sarah Kim",
    role: "Content Creator",
    quote: "Omnis cut my design time in half. I can generate professional visuals in seconds without touching Photoshop.",
  },
  {
    initials: "MJ",
    name: "Marcus Johnson",
    role: "Marketing Director",
    quote: "We use Omnis for all our social media assets. The quality is consistently stunning and the speed is unmatched.",
  },
  {
    initials: "AL",
    name: "Aiko Lin",
    role: "Independent Artist",
    quote: "It's like having a creative partner that never runs out of ideas. Omnis helps me explore concepts I'd never have thought of.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""

export function SocialProof() {
  const [generations, setGenerations] = useState<PublicGeneration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    fetch(`${API_BASE}/generations/public`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data)) setGenerations(data.slice(0, 6))
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  return (
    <section id="social-proof" className="py-24 sm:py-32 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            See what Omnis creates
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            From photorealistic portraits to conceptual art — see what our community is making every day.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-20"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="aspect-square rounded-xl overflow-hidden bg-card border border-border flex items-center justify-center"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-muted" />
                </motion.div>
              ))
            : generations.length > 0
              ? generations.map((gen) => (
                  <motion.div
                    key={gen.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer bg-card"
                  >
                    <img
                      src={gen.imageUrl}
                      alt={gen.prompt}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs text-white/90 leading-tight line-clamp-2">
                        {gen.prompt}
                      </p>
                    </div>
                  </motion.div>
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="aspect-square rounded-xl overflow-hidden bg-card border border-border flex items-center justify-center"
                  >
                    <Image className="h-8 w-8 text-muted" />
                  </motion.div>
                ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-semibold">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm text-muted">
            <span className="font-semibold text-foreground">2.4M</span>
            <span>images generated</span>
            <span className="text-border">·</span>
            <span className="font-semibold text-foreground">85K</span>
            <span>creators</span>
            <span className="text-border">·</span>
            <span className="font-semibold text-foreground">12K</span>
            <span>videos made</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
