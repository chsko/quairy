import type { Metadata } from "next";
import Link from "next/link";
import { Waitlist } from "@clerk/nextjs";
import { AuthCardSkeleton, AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = {
  alternates: { canonical: "/waitlist" },
  title: "Join the waitlist – Quairy",
  description: "Accounts and Quairy Pro are coming soon. Join the waitlist to hear when they open.",
};

/** Prebuilt: the page is the same for everyone. */
export function generateStaticParams() {
  return [{ waitlist: [] }];
}

/**
 * Where sign-up points while accounts are closed (`SIGNUPS_OPEN`): Clerk's
 * waitlist, in the Quarry theme. Each entry is someone interested enough to
 * leave their email, which the admin dashboard counts.
 */
export default function WaitlistPage() {
  return (
    <AuthPage
      prefetch="/sign-in"
      footnote={
        <>
          Accounts and Quairy Pro are coming soon. Searching works today, no account needed. We
          only use your email to tell you when they open; see the{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>
          .
        </>
      }
    >
      <Waitlist fallback={<AuthCardSkeleton label="Loading the waitlist…" />} />
    </AuthPage>
  );
}
