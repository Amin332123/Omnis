"use client"

import Link from "next/link"
import { Search, ChevronDown, Menu, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { CreditBadge } from "@/components/dashboard/credit-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { formatCredits } from "@/lib/credit-cost"

interface TopNavProps {
  onMenuClick?: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const initials = user?.initials ?? ""
  const credits = user?.credits ?? 0
  const displayName = user?.displayName ?? user?.email ?? "Account"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:px-6">
      <div className="flex-1 flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            placeholder="Search generations..."
            className="pl-9 h-9 bg-secondary border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <CreditBadge credits={credits} />

        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/5 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Buy Credits</span>
        </Link>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl ?? undefined} className="object-cover" />
                <AvatarFallback className="text-xs bg-accent/10 text-accent">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">{displayName}</p>
                <p className="text-xs text-muted leading-tight">{formatCredits(credits)} credits</p>
              </div>
              <ChevronDown className="hidden sm:block h-4 w-4 text-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Profile Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing">Wallet</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout()
                router.push("/login")
              }}
              className="text-error"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
