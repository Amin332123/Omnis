"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > window.innerHeight - 100)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "border-b border-border bg-background/80 backdrop-blur-xl" : "border-transparent bg-transparent"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Omnis Studio" className="h-8 w-8 object-contain" />
              <span className={`text-lg font-semibold transition-colors duration-300 ${isScrolled ? "text-foreground" : "text-white"}`}>Omnis Studio</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors duration-300 ${isScrolled ? "text-muted hover:text-foreground" : "text-white/70 hover:text-white"}`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden sm:flex" />
            <Link href="/login">
              <Button variant="ghost" className={`hidden sm:inline-flex transition-all duration-300 ${isScrolled ? "text-foreground hover:text-foreground hover:bg-accent/10" : "text-white hover:text-white hover:bg-white/10 px-6 py-2.5"}`}>
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className={`transition-all duration-300 ${isScrolled ? "" : "bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20 px-6 py-2.5"}`}>Get Started</Button>
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`md:hidden h-9 w-9 rounded-lg border flex items-center justify-center transition-colors duration-300 ${isScrolled ? "border-border text-foreground" : "border-white/30 text-white"}`}
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-sm text-muted hover:text-foreground transition-colors py-2"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <ThemeToggle />
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
