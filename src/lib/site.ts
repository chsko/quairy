export const SITE_DESCRIPTION =
  "Ask a yes/no, pick-one or rating question. Quairy finds the answer and shows how sure it is.";

/**
 * Where the site runs, so share images and other metadata URLs are absolute:
 * the real domain in production, the deployment's own URL on previews, and
 * localhost when running locally.
 */
export const SITE_URL = new URL(
  process.env.VERCEL_ENV === "production"
    ? "https://www.quairy.me"
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT ?? 3000}`,
);
