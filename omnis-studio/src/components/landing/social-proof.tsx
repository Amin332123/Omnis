"use client"

import { motion } from "framer-motion"
import { Image, Sparkles, Mountain, Cat, Palette, Music } from "lucide-react"

const images = [
  { icon: Mountain, label: "Mountain landscape", gradient: "from-violet-500 to-purple-600" },
  { icon: Cat, label: "Cyberpunk cat", gradient: "from-blue-500 to-cyan-500" },
  { icon: Palette, label: "Abstract art", gradient: "from-rose-500 to-pink-600" },
  { icon: Sparkles, label: "Fantasy castle", gradient: "from-amber-500 to-orange-600" },
  { icon: Image, label: "Portrait", gradient: "from-emerald-500 to-teal-600" },
  { icon: Music, label: "Album cover", gradient: "from-indigo-500 to-violet-600" },
]

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

export function SocialProof() {
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
          {images.map((image) => (
            <motion.div
              key={image.label}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${image.gradient} opacity-80 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                <image.icon className="h-10 w-10 drop-shadow-lg" />
                <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {image.label}
                </span>
              </div>
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
