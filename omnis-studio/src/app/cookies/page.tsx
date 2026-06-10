import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function CookiesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-8">Cookie Policy</h1>
        <p className="text-sm text-muted mb-8">Last updated: June 10, 2026</p>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">What Are Cookies</h2>
            <p>Cookies are small text files stored on your device by your web browser. They help websites remember your preferences and improve your experience.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Cookies We Use</h2>
            <p><strong>Essential cookies:</strong> We use a session-based mechanism to keep you logged in during your visit. No third-party authentication cookies are used. The platform does not set persistent tracking cookies by default.</p>
            <p><strong>Analytics cookies:</strong> We may use analytics tools to understand how the platform is used, including page views, feature usage, and error rates. These are anonymized and cannot be used to identify you personally.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Managing Cookies</h2>
            <p>Most web browsers allow you to control cookies through settings. You can block or delete cookies, but doing so may affect the functionality of the platform. The &quot;Remember Me&quot; feature on login uses localStorage, not cookies.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Third-Party Cookies</h2>
            <p>We do not use third-party advertising cookies. Third-party services integrated into the platform (such as payment processors) may set their own cookies, which are governed by their respective privacy policies.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact</h2>
            <p>If you have questions about our use of cookies, contact us at <a href="mailto:privacy@omnis-studio.com" className="text-accent hover:underline">privacy@omnis-studio.com</a>.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
