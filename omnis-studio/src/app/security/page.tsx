import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-8">Security</h1>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">HTTPS and Encryption</h2>
            <p>All communication between your browser and our servers is encrypted using TLS 1.3. All API requests and responses are transmitted over HTTPS. This ensures that your data, including prompts, generated content, and authentication tokens, cannot be intercepted or modified in transit.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data Storage</h2>
            <p>Passwords are never stored in plain text. They are hashed using bcrypt with a cost factor of 10 before being stored in our database. Authentication is handled via short-lived JWTs stored in localStorage, not cookies, which protects against CSRF attacks.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Infrastructure</h2>
            <p>Our infrastructure runs on encrypted cloud servers with strict access controls. Database access is limited to application-level credentials with no direct public access. Regular security audits and dependency updates are performed to address vulnerabilities.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data Handling</h2>
            <p>Generated images and videos are stored securely and are only accessible to the account that created them. Prompts and generation metadata are stored for service operation and improvement. We do not share your generations with third parties without your consent.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Vulnerability Disclosure</h2>
            <p>If you discover a security vulnerability, please report it responsibly to <a href="mailto:security@omnis-studio.com" className="text-accent hover:underline">security@omnis-studio.com</a>. We will acknowledge receipt within 48 hours and work to resolve the issue promptly.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
