"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })

  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.6], [0, -80])

  const floatingOrbs = [
    { size: 300, x: "10%", y: "15%", delay: 0, duration: 8 },
    { size: 200, x: "80%", y: "20%", delay: 2, duration: 10 },
    { size: 250, x: "70%", y: "70%", delay: 4, duration: 9 },
    { size: 180, x: "20%", y: "75%", delay: 1, duration: 7 },
  ]
  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center overflow-hidden">
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/40 backdrop-blur-md px-4 py-1.5 mb-8"
            >
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-2 w-2 rounded-full bg-emerald-400"
              />
              <span className="text-xs font-medium text-white/80">AI-powered creative studio</span>
              <Sparkles className="h-3 w-3 text-white/40" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 drop-shadow-lg"
          >
            Create Social Media{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient">Content with AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-white max-w-4xl mx-auto mb-10 leading-relaxed drop-shadow-lg"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Generate product photos, marketing visuals, and social media content in minutes.{" "}
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="text-white"
            >
              No design skills needed.
            </motion.span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="xl" className="gap-2 shadow-lg text-white relative overflow-hidden group">
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "200%" }}
                    transition={{ duration: 0.6 }}
                  />
                  Start Creating
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Button>
              </motion.div>
            </Link>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" size="xl" className="gap-2 text-white border-white/30 bg-white/10 backdrop-blur-md shadow-lg hover:bg-white/20 group">
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="inline-flex"
                >
                  <Play className="h-4 w-4" />
                </motion.span>
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        style={{ scale: videoScale }}
        className="absolute inset-0 -z-10 overflow-hidden dark:hidden"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/bg_light.mp4" type="video/mp4" />
        </video>
      </motion.div>
      <motion.div
        style={{ scale: videoScale }}
        className="absolute inset-0 -z-10 overflow-hidden hidden dark:block"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero_bg_dark.mp4" type="video/mp4" />
        </video>
      </motion.div>
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute -z-20 rounded-full bg-white/5 blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 4s ease infinite;
        }
      `}</style>
      <motion.div
        style={{ opacity: useTransform(scrollYProgress, [0.4, 0.8], [0, 1]) }}
        className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-background pointer-events-none -z-10"
      />
    </section>
  )
}
