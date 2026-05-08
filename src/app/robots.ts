import type { MetadataRoute } from "next";

const origin = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.jurnex.cl").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/admin/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
