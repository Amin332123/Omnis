import type { Metadata } from "next"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "Changelog – Omnis Studio Updates & Releases",
  description:
    "Stay up to date with the latest Omnis Studio features, improvements, and bug fixes.",
  alternates: {
    canonical: "https://omnis-studio.com/changelog",
  },
  openGraph: {
    title: "Changelog – Omnis Studio Updates",
    description: "Latest updates and releases from Omnis Studio.",
    url: "https://omnis-studio.com/changelog",
  },
}

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Changelog</h1>
        <p className="text-muted max-w-md">We&apos;re working on this page. Check back soon for updates on new features, improvements, and fixes.</p>
      </main>
      <Footer />
    </>
  )
}
