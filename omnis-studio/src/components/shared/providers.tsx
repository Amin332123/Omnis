"use client"

import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/context/auth-context"
import { GenerationsProvider } from "@/context/generations-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <GenerationsProvider>{children}</GenerationsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
