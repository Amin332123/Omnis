import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { blogPosts } from "@/data/blog-posts"

export const metadata: Metadata = {
  title: "Omnis Studio Blog – AI Image & Video Tips, Tutorials & News",
  description:
    "Explore tutorials, tips, and news about AI image generation, video creation, and social media content from the Omnis Studio team.",
  alternates: {
    canonical: "https://omnis-studio.com/blog",
  },
  openGraph: {
    title: "Omnis Studio Blog",
    description:
      "Explore tutorials, tips, and news about AI image generation, video creation, and social media content.",
    url: "https://omnis-studio.com/blog",
  },
}

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-24 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8 text-center">
          Omnis Studio Blog
        </h1>
        <p className="text-muted text-center mb-12 max-w-2xl mx-auto">
          Tutorials, tips, and news about AI image generation, video creation, and social
          media content.
        </p>
        <div className="grid gap-8">
          {blogPosts.map((post) => (
            <article key={post.slug} className="border border-border rounded-lg p-6">
              <time className="text-sm text-muted">{post.date}</time>
              <h2 className="text-xl font-semibold mt-2 mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-accent transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-muted">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block mt-4 text-accent hover:underline"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
