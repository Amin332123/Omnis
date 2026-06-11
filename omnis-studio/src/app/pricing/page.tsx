import type { Metadata } from "next"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Pricing } from "@/components/landing/pricing"
import type { PlanResponse } from "@/lib/plans-api"
import { mapPlanToCreditPack } from "@/lib/plans-api"
import type { CreditPack } from "@/lib/types"

export const metadata: Metadata = {
  title: "Omnis Studio Pricing – Simple Credit Packs, No Subscriptions",
  description:
    "Buy AI generation credits on Omnis Studio. No monthly fees. Pay only for what you create — images and videos on demand.",
  alternates: {
    canonical: "https://omnis-studio.com/pricing",
  },
  openGraph: {
    title: "Omnis Studio Pricing",
    description:
      "Simple credit packs, no subscriptions. Pay only for what you create.",
    url: "https://omnis-studio.com/pricing",
  },
}

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

export default async function PricingPage() {
  const plansResult = await fetchPlans()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PriceSpecification",
    name: "Omnis Studio Credit Packs",
    description:
      "Buy credits to generate AI images and videos. No subscriptions.",
    url: "https://omnis-studio.com/pricing",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 pt-24">
        <Pricing packs={plansResult ?? []} />
      </main>
      <Footer />
    </>
  )
}
