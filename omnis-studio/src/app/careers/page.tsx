import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Careers</h1>
        <p className="text-muted max-w-md">We&apos;re not currently hiring, but we&apos;re always excited to meet talented people. Check back later for open positions.</p>
      </main>
      <Footer />
    </>
  )
}
