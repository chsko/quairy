import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Separator } from "@/components/ui/separator";
import { Analytics } from "@vercel/analytics/next";
import { JOIN_URL } from "@/lib/launch";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const description = SITE_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: "Quairy",
  description,
  applicationName: "Quairy",
  // Only production belongs in search engines; previews and local runs stay out.
  robots: process.env.VERCEL_ENV === "production" ? undefined : { index: false, follow: false },
  // Google Search Console's HTML-tag verification, when its token is set.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  // Relative URLs, such as the card image, resolve against metadataBase.
  openGraph: { siteName: "Quairy", title: "Quairy", description, images: "/card" },
  twitter: { card: "summary_large_image", title: "Quairy", description, images: "/card" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1013" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ClerkProvider
          // The shadcn theme fills inputs with --input, which in the Quarry palette is a
          // border shade; use the card colour so fields don't look disabled.
          appearance={{ theme: shadcn, variables: { colorInput: "var(--card)" } }}
          signInUrl="/sign-in"
          signUpUrl={JOIN_URL}
          waitlistUrl="/waitlist"
        >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {children}
        <footer className="flex flex-col" style={{ viewTransitionName: "site-footer" }}>
          <Separator />
          <div className="flex flex-col items-center gap-1.5 px-4 py-4 text-center text-xs text-muted-foreground">
            <p>
              Answers powered by Jev, a System One model from{" "}
              <a href="https://typesafe.ai" className="underline-offset-4 hover:underline">
                TypeSafe
              </a>
            </p>
            <nav aria-label="Legal" className="flex gap-3">
              <Link href="/terms" className="underline-offset-4 hover:underline">
                Terms
              </Link>
              <Link href="/privacy" className="underline-offset-4 hover:underline">
                Privacy
              </Link>
            </nav>
          </div>
        </footer>
        <Analytics />
        {/* Real-user Core Web Vitals, reported to Vercel Speed Insights. */}
        <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}
