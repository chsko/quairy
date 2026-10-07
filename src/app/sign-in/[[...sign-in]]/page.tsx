import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthCardSkeleton, AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = { title: "Sign in – Quairy" };

/** Prebuilt: the page is the same for everyone. Clerk's later steps render on demand. */
export function generateStaticParams() {
  return [{ "sign-in": [] }];
}

// Quairy's own sign-in page, in the Quarry theme, instead of Clerk's hosted one.
export default function SignInPage() {
  return (
    <AuthPage prefetch="/sign-up">
      <SignIn fallback={<AuthCardSkeleton label="Loading sign in…" />} />
    </AuthPage>
  );
}
