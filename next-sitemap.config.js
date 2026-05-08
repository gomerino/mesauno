/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://www.jurnex.cl",
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ["/login", "/onboarding", "/dashboard", "/invitacion/*", "/api/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/login", "/onboarding", "/dashboard", "/api/"],
      },
    ],
    additionalSitemaps: ["https://www.jurnex.cl/sitemap.xml"],
  },
};
