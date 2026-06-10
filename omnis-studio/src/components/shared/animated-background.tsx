"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"

const orbs = [
  { size: 350, x: "-5%", y: "10%", delay: 0, duration: 12, colors: ["#a855f7", "#c084fc"] },
  { size: 250, x: "80%", y: "15%", delay: 2, duration: 14, colors: ["#ec4899", "#f472b6"] },
  { size: 300, x: "85%", y: "75%", delay: 4, duration: 11, colors: ["#6366f1", "#818cf8"] },
  { size: 200, x: "10%", y: "80%", delay: 1, duration: 13, colors: ["#f59e0b", "#fbbf24"] },
]

const dots = Array.from({ length: 25 }, (_, i) => ({
  left: `${((i * 137.5) % 100)}%`,
  top: `${((i * 89.3) % 100)}%`,
  delay: (i * 0.2) % 4,
  duration: 3 + (i % 5),
  size: 1 + (i % 3),
}))

export function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const isDark = useRef(false)

  useEffect(() => {
    isDark.current = document.documentElement.classList.contains("dark")
    const onMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />

      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.3]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, transparent 0%, var(--color-background) 100%)",
          }}
        />
      </div>

      {orbs.map((orb, i) => {
        const offsetX = (mousePos.x - 0.5) * 20 * (i + 1)
        const offsetY = (mousePos.y - 0.5) * 20 * (i + 1)
        return (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              width: orb.size,
              height: orb.size,
              left: orb.x,
              top: orb.y,
              background: `radial-gradient(circle, ${orb.colors[0]}15 0%, ${orb.colors[1]}08 50%, transparent 70%)`,
            }}
            animate={{
              x: [0, 40 + offsetX, -30 + offsetX, 20, 0],
              y: [0, -30 + offsetY, 40 + offsetY, -20, 0],
            }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: orb.delay,
            }}
          />
        )
      })}

      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-foreground/10 dark:bg-foreground/20"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            delay: dot.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
