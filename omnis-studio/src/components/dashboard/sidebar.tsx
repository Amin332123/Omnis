"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Image,
  Video,
  History,
  CreditCard,
  Settings,
  Shield,
  Package,
  GalleryVerticalEnd,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"


interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobileOpen: boolean
  onMobileToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const sidebarLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Generate Images", href: "/dashboard/generate/images", icon: Image },
    { label: "Generate Videos", href: "/dashboard/generate/videos", icon: Video },
    { label: "History", href: "/dashboard/history", icon: History },
    { label: "Wallet", href: "/dashboard/billing", icon: CreditCard },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ...(user?.isAdmin
      ? [
          { label: "Plans", href: "/dashboard/plans", icon: Package },
          { label: "Media Gallery", href: "/dashboard/admin/media", icon: GalleryVerticalEnd },
          { label: "Admin", href: "/dashboard/admin", icon: Shield },
        ]
      : []),
  ] as const

  const navContent = (mobile: boolean) => (
    <nav className="flex-1 p-2 space-y-1">
      {sidebarLinks.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={mobile ? onMobileToggle : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted hover:bg-sidebar-hover hover:text-foreground"
            )}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {(!isCollapsed || mobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                {link.label}
              </motion.span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  const headerContent = (mobile: boolean) => (
    <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
      <Link href="/" className="flex items-center gap-2 shrink-0" onClick={mobile ? onMobileToggle : undefined}>
        <img src="/logo.png" alt="Omnis Studio" className="h-8 w-8 object-contain" />
      </Link>
      {(!isCollapsed || mobile) && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-sm font-semibold text-foreground whitespace-nowrap"
        >
          Omnis Studio
        </motion.span>
      )}
      {mobile && (
        <button
          onClick={onMobileToggle}
          className="ml-auto h-8 w-8 rounded-lg flex items-center justify-center hover:bg-sidebar-hover transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )

  const footerContent = (mobile: boolean) => (
    <div className="p-2 border-t border-border space-y-1">
      {!isCollapsed || mobile ? (
        <Link
          href="/dashboard/settings"
          onClick={mobile ? onMobileToggle : undefined}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-sidebar-hover hover:text-foreground transition-colors"
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={user?.avatarUrl ?? undefined} className="object-cover" />
            <AvatarFallback className="text-[10px] bg-accent/10 text-accent">
              {user?.initials ?? "U"}
            </AvatarFallback>
          </Avatar>
          {(!isCollapsed || mobile) && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="truncate"
            >
              {user?.displayName ?? "Account"}
            </motion.span>
          )}
        </Link>
      ) : null}
      {mobile ? (
        <div className="px-3 py-2 text-xs text-muted">Omnis Studio v1.0</div>
      ) : (
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full rounded-lg px-3 py-2 text-sm text-muted hover:bg-sidebar-hover hover:text-foreground transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </motion.div>
          )}
        </button>
      )}
    </div>
  )

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed left-0 top-0 bottom-0 z-40 flex-col border-r border-border bg-sidebar hidden lg:flex"
      >
        {headerContent(false)}
        {navContent(false)}
        {footerContent(false)}
      </motion.aside>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed left-0 top-0 bottom-0 z-50 w-60 border-r border-border bg-sidebar flex flex-col lg:hidden shadow-2xl"
          >
            {headerContent(true)}
            {navContent(true)}
            {footerContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
