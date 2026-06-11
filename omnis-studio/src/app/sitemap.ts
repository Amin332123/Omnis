import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://omnis-studio.com/",
      lastModified: new Date("2026-06-11"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://omnis-studio.com/about",
      lastModified: new Date("2026-06-11"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://omnis-studio.com/pricing",
      lastModified: new Date("2026-06-11"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://omnis-studio.com/blog",
      lastModified: new Date("2026-06-11"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://omnis-studio.com/changelog",
      lastModified: new Date("2026-06-11"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://omnis-studio.com/contact",
      lastModified: new Date("2026-06-11"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ]
}
