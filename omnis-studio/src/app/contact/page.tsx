import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Contact</h1>
        <p className="text-muted max-w-md">
          Reach us at{" "}
          <a href="mailto:support@omnis-studio.com" className="text-accent hover:underline">
            support@omnis-studio.com
          </a>
          . We&apos;ll get back to you as soon as possible.
        </p>
      </main>
      <Footer />
    </>
  )
}
