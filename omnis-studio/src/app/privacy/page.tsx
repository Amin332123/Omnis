import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <p className="text-sm text-muted mb-8">Last updated: June 10, 2026</p>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p>When you create an account, we collect your email address and a securely hashed password. If you upload a profile avatar, we store that image. We also collect data about your usage of the platform, including prompts submitted, images and videos generated, and credits consumed.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
            <p>We use your information to operate and improve the service, process generations, manage your account and credits, send transactional emails (verification, password reset, billing), and provide customer support. With your consent, we may send marketing communications.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Cookies</h2>
            <p>We use essential cookies to maintain your session and keep you logged in. We also use analytics cookies to understand how the platform is used. You can manage cookie preferences in your browser settings. See our <a href="/cookies" className="text-accent hover:underline">Cookie Policy</a> for details.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Sharing</h2>
            <p>We do not sell your personal data. We may share data with third-party service providers who help us operate the platform (cloud hosting, email delivery, AI inference providers). These providers are contractually bound to protect your data and use it only for the services we request.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. If you delete your account, your personal data is removed or anonymized within 30 days. Generation outputs may be retained for service improvement purposes after anonymization.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You can manage most of this from your account settings. For additional requests, contact us at the email below.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Contact</h2>
            <p>If you have questions about this policy, please contact us at <a href="mailto:privacy@omnis-studio.com" className="text-accent hover:underline">privacy@omnis-studio.com</a>.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
