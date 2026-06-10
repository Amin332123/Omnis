import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-8">Terms of Service</h1>
        <p className="text-sm text-muted mb-8">Last updated: June 10, 2026</p>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account and using Omnis Studio, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Credit System</h2>
            <p>Credits are purchased and consumed on a per-generation basis. Each generation deducts a specific number of credits based on the model and settings used. Unused credits remain on your account until spent. Credits are not redeemable for cash.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. No-Refunds Policy</h2>
            <p>All credit purchases and subscription payments are final and non-refundable, except as required by applicable law. If you believe an error has occurred, contact <a href="mailto:support@omnis-studio.com" className="text-accent hover:underline">support@omnis-studio.com</a> within 14 days.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Acceptable Use</h2>
            <p>You agree not to use Omnis Studio to generate content that is illegal, harmful, threatening, abusive, harassing, defamatory, or infringing on the rights of others. We reserve the right to suspend or terminate accounts that violate this policy without notice.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Termination</h2>
            <p>We may suspend or terminate your account at any time for violation of these terms. You may delete your account at any time from your settings. Upon termination, you lose access to any remaining credits.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Intellectual Property</h2>
            <p>You retain ownership of the content you generate. By using the service, you grant us a license to store, process, and display your content as necessary to provide the service. We do not claim ownership of your generations.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Limitation of Liability</h2>
            <p>Omnis Studio is provided &quot;as is&quot; without warranty of any kind. We are not liable for damages arising from your use or inability to use the service, including loss of data, credits, or generated content.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
