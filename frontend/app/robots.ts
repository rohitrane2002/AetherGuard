import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/account/"],
      },
    ],
    sitemap: "https://aetherguard.vercel.app/sitemap.xml",
  };
}
