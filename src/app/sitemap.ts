import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.jurnex.cl";
const base = new URL(siteUrl).origin;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/onboarding`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/para-proveedores`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
