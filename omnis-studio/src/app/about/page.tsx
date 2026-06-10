import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">About</h1>
        <p className="text-muted max-w-md">We&apos;re putting the finishing touches on this page. Stay tuned to learn more about the team behind Omnis Studio.</p>
      </main>
      <Footer />
    </>
  )
}
