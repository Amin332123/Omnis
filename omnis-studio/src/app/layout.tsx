import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/shared/providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://omnis-studio.com"),
  title: {
    default: "Omnis Studio – AI Image & Video Generator for Social Media",
    template: "%s | Omnis Studio",
  },
  description:
    "Omnis Studio is an AI-powered creative platform to generate stunning images and videos in seconds. Perfect for creators, marketers, and teams. No design skills needed.",
  keywords: [
    "Omnis Studio",
    "AI image generator",
    "AI video generator",
    "social media content AI",
    "AI creative studio",
    "text to image",
    "text to video",
    "marketing visuals AI",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Omnis Studio",
    url: "https://omnis-studio.com/",
    title: "Omnis Studio – AI Image & Video Generator",
    description:
      "Generate professional AI images and videos in seconds. No design skills needed. Join 85,000+ creators on Omnis Studio.",
    images: [
      {
        url: "https://omnis-studio.com/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@omnisstudio",
    title: "Omnis Studio – AI Image & Video Generator",
    description: "Create stunning AI images and videos in seconds. Join 85K+ creators.",
    images: ["https://omnis-studio.com/og-image.jpg"],
  },
  other: {
    "theme-color": "#000000",
    "robots": "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <link rel="preconnect" href="https://cdn.paddle.com" />
        <link rel="preload" href="https://cdn.paddle.com/paddle/v2/paddle.js" as="script" />
        {process.env.NEXT_PUBLIC_API_URL ? (
          <link rel="preconnect" href={new URL(process.env.NEXT_PUBLIC_API_URL).origin} />
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
