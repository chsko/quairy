import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * The pages worth finding in search. Search results themselves aren't listed:
 * they're endless, made on demand, and marked noindex.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly") => ({
    url: new URL(path, SITE_URL).toString(),
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/text", 0.8, "monthly"),
    page("/pro", 0.6, "monthly"),
    page("/waitlist", 0.4, "monthly"),
    page("/terms", 0.2, "yearly"),
    page("/privacy", 0.2, "yearly"),
  ];
}
