"use client"

import Link from "next/link"
import { Heart } from "lucide-react"

const footerLinks = {
  Product: ["Features", "Pricing", "FAQ", "Changelog"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Omnis Studio" className="h-8 w-8 object-contain" />
              <span className="text-lg font-semibold text-foreground">Omnis Studio</span>
            </Link>
            <p className="text-sm text-muted max-w-xs">
              Create stunning AI-generated images and videos with our powerful platform.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            &copy; 2026 Omnis Studio. All rights reserved.
          </p>
          <p className="text-xs text-muted flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-accent" /> by Omnis Team
          </p>
        </div>
      </div>
    </footer>
  )
}
