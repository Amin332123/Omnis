"use client"

import { motion } from "framer-motion"
import { Image, Video, CreditCard, Zap, Lock, History } from "lucide-react"

const features = [
  {
    icon: Image,
    title: "AI Image Generation",
    description: "Create stunning, photorealistic images from text prompts using cutting-edge AI models.",
  },
  {
    icon: Video,
    title: "AI Video Generation",
    description: "Generate high-quality videos with smooth motion and cinematic quality from simple prompts.",
  },
  {
    icon: CreditCard,
    title: "Credit-Based Billing",
    description: "Pay only for what you use with our simple and transparent credit system.",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Get your generations in seconds with our optimized infrastructure.",
  },
  {
    icon: Lock,
    title: "Secure Accounts",
    description: "Your data and creations are protected with enterprise-grade security.",
  },
  {
    icon: History,
    title: "Generation History",
    description: "Access and download all your past generations anytime.",
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

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you need to create
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Powerful tools designed for creators, marketers, and teams.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/50"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-200">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
