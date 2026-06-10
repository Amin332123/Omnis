import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Changelog</h1>
        <p className="text-muted max-w-md">We&apos;re working on this page. Check back soon for updates on new features, improvements, and fixes.</p>
      </main>
      <Footer />
    </>
  )
}
