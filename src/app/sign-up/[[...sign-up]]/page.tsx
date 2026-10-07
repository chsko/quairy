import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { AuthCardSkeleton, AuthPage } from "@/components/AuthPage";
import { SIGNUPS_OPEN } from "@/lib/launch";

export const metadata: Metadata = { title: "Create your account – Quairy", robots: { index: false } };

/** Prebuilt: the page is the same for everyone. Clerk's later steps render on demand. */
export function generateStaticParams() {
  return [{ "sign-up": [] }];
}

// Quairy's own sign-up page, in the Quarry theme, instead of Clerk's hosted one.
export default function SignUpPage() {
  if (!SIGNUPS_OPEN) redirect("/waitlist");
  return (
    <AuthPage
      prefetch="/sign-in"
      footnote={
        <>
          By creating an account you agree to the{" "}
          <Link href="/terms" className="underline underline-offset-4">
            terms of service
          </Link>{" "}
          and confirm you’ve read the{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>
          .
        </>
      }
    >
      <SignUp fallback={<AuthCardSkeleton label="Loading sign up…" />} />
    </AuthPage>
  );
}
