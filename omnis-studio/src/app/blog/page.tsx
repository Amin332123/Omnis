import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Blog</h1>
        <p className="text-muted max-w-md">Our blog is coming soon. We&apos;ll be sharing tips, updates, and insights about AI generation.</p>
      </main>
      <Footer />
    </>
  )
}
