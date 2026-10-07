import type { NextConfig } from "next";
import { SIGNUPS_OPEN } from "./src/lib/launch";

const nextConfig: NextConfig = {
  // The share card reads its fonts from disk at request time.
  outputFileTracingIncludes: {
    "/card": ["./src/assets/fonts/*.woff"],
  },
  // While sign-ups are closed, sign-up links land on the waitlist (a real redirect,
  // not the prebuilt page's client-side one).
  async redirects() {
    return SIGNUPS_OPEN
      ? []
      : [{ source: "/sign-up/:path*", destination: "/waitlist", permanent: false }];
  },
};

export default nextConfig;
