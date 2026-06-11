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

  return (
    <>
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
