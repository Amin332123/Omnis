import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { blogPosts } from "@/data/blog-posts"

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) return {}

  return {
    title: `${post.title} | Omnis Studio Blog`,
    description: post.excerpt.slice(0, 155),
    alternates: {
      canonical: `https://omnis-studio.com/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `https://omnis-studio.com/blog/${post.slug}`,
      publishedTime: post.dateISO,
      images: [
        {
          url: `https://omnis-studio.com/blog/${post.slug}/cover.jpg`,
        },
      ],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: `https://omnis-studio.com/blog/${post.slug}`,
    datePublished: post.dateISO,
    dateModified: post.dateISO,
    author: {
      "@type": "Organization",
      name: "Omnis Studio",
    },
    publisher: {
      "@type": "Organization",
      name: "Omnis Studio",
      logo: {
        "@type": "ImageObject",
        url: "https://omnis-studio.com/logo.png",
      },
    },
    image: `https://omnis-studio.com/blog/${post.slug}/cover.jpg`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 px-4 py-24 max-w-3xl mx-auto">
        <Link
          href="/blog"
          className="text-accent hover:underline mb-8 inline-block"
        >
          ← Back to Blog
        </Link>
        <article>
          <time className="text-sm text-muted">{post.date}</time>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-6">
            {post.title}
          </h1>
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </article>
      </main>
      <Footer />
    </>
  )
}
