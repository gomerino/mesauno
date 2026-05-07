import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.jurnex.cl";
const origin = new URL(siteUrl).origin;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/panel/", "/api/", "/auth/", "/staff/", "/proveedor/"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
