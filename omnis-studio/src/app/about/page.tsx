import type { Metadata } from "next"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "About Omnis Studio – The AI Creative Platform",
  description:
    "Learn about Omnis Studio, the AI-powered platform helping 85,000+ creators, marketers, and teams generate stunning images and videos instantly.",
  openGraph: {
    title: "About Omnis Studio",
    description:
      "The story behind Omnis Studio — built for creators who want to generate stunning AI content fast.",
    url: "https://omnis-studio.com/about",
  },
  alternates: {
    canonical: "https://omnis-studio.com/about",
  },
}

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Omnis Studio",
    url: "https://omnis-studio.com/about",
    description:
      "Omnis Studio is an AI-powered creative platform trusted by 85,000+ creators worldwide.",
    publisher: {
      "@type": "Organization",
      name: "Omnis Studio",
      url: "https://omnis-studio.com",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">About Omnis Studio</h1>
        <p className="text-muted max-w-md">
          We&apos;re putting the finishing touches on this page. Stay tuned to learn more
          about the team behind Omnis Studio.
        </p>
      </main>
      <Footer />
    </>
  )
}
