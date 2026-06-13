"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { PricingCard } from "@/components/shared/pricing-card"
import type { CreditPack } from "@/lib/types"

export function Pricing({ packs }: { packs: CreditPack[] }) {
  const router = useRouter()

  const handleSelect = () => {
    router.push("/dashboard/billing")
  }

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple credit packs, no subscriptions
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Buy credits, create content. No monthly commitments, no hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {packs.length > 0 ? (
            packs.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <PricingCard pack={pack} className={pack.popular ? "py-14" : ""} onSelect={handleSelect} />
              </motion.div>
            ))
          ) : (
            <p className="col-span-full text-center text-muted">No credit packs available at this time.</p>
          )}
        </div>
      </div>
    </section>
  )
}
