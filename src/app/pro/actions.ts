"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createCheckout } from "@/lib/billing";
import { PRO_OPEN } from "@/lib/launch";

async function origin() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

/**
 * Sends a signed-in visitor to Stripe Checkout for Quairy Pro. Signed-out
 * visitors most likely have no account yet, so they're sent to sign up
 * (which links to sign-in) and come back here afterwards.
 */
export async function subscribe(formData: FormData) {
  // Coming soon: nobody can start a checkout, even by calling this directly.
  if (!PRO_OPEN) redirect("/pro");
  const interval = formData.get("interval") === "year" ? "year" : "month";
  const { userId } = await auth();
  if (!userId) redirect(`/sign-up?${new URLSearchParams({ redirect_url: "/pro" })}`);
  const user = await currentUser();
  const url = await createCheckout({
    userId,
    email: user?.primaryEmailAddress?.emailAddress,
    origin: await origin(),
    interval,
  });
  redirect(url);
}
