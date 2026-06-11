import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { SocialProof } from "@/components/landing/social-proof"
import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"
import { Footer } from "@/components/landing/footer"
import type { PlanResponse } from "@/lib/plans-api"
import { mapPlanToCreditPack } from "@/lib/plans-api"
import type { CreditPack } from "@/lib/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""

async function fetchPlans(): Promise<CreditPack[] | null> {
  try {
    const res = await fetch(`${API_BASE}/plans`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const plans: PlanResponse[] = await res.json()
    return plans.map(mapPlanToCreditPack)
  } catch {
    return null
  }
}

interface PublicGeneration {
  id: string
  imageUrl: string
  prompt: string
  model: string
}

async function fetchGenerations(): Promise<PublicGeneration[] | null> {
  try {
    const res = await fetch(`${API_BASE}/generations/public`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data.slice(0, 6) : null
  } catch {
    return null
  }
}

export default async function LandingPage() {
  const [plansResult, generationsResult] = await Promise.all([
    fetchPlans(),
    fetchGenerations(),
  ])

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://omnis-studio.com/#organization",
        name: "Omnis Studio",
        url: "https://omnis-studio.com",
        logo: {
          "@type": "ImageObject",
          url: "https://omnis-studio.com/logo.png",
        },
        description:
          "Omnis Studio is an AI-powered creative platform for generating images and videos.",
        sameAs: [
          "https://twitter.com/omnisstudio",
          "https://www.linkedin.com/company/omnis-studio",
          "https://www.instagram.com/omnisstudio",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://omnis-studio.com/#website",
        url: "https://omnis-studio.com",
        name: "Omnis Studio",
        publisher: { "@id": "https://omnis-studio.com/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://omnis-studio.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "Omnis Studio",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        url: "https://omnis-studio.com",
        description:
          "AI-powered platform to generate images and videos from text prompts.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Credit-based pricing. Pay only for what you use.",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          reviewCount: "1200",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do credits work on Omnis Studio?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Each image or video generation costs a set number of credits. You purchase credit packs and use them at your own pace with no expiry.",
            },
          },
          {
            "@type": "Question",
            name: "Is there a free trial on Omnis Studio?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, new users receive free starter credits upon registration to try the platform.",
            },
          },
          {
            "@type": "Question",
            name: "Can I use Omnis Studio generated content commercially?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, all content generated on Omnis Studio can be used for commercial purposes including marketing, advertising, and social media.",
            },
          },
          {
            "@type": "Question",
            name: "How long does AI generation take on Omnis Studio?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Most image generations are completed within seconds. Video generation may take slightly longer depending on length and complexity.",
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <SocialProof generations={generationsResult ?? []} />
        <Pricing packs={plansResult ?? []} />
        <FAQ />
      </main>
      <Footer />
    </>
  )
}
