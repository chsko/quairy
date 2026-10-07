import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PartyPopperIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getStripe, isPro, syncSubscription } from "@/lib/billing";

export const metadata: Metadata = { title: "Welcome to Quairy Pro", robots: { index: false } };

/**
 * Where Stripe Checkout returns. Webhooks keep subscriptions up to date, but
 * syncing here too means Pro is on the moment someone lands, even if the
 * webhook is still on its way.
 */
export default async function WelcomePage({ searchParams }: PageProps<"/pro/welcome">) {
  const { userId } = await auth();
  const sessionId = (await searchParams).session_id;
  if (!userId || typeof sessionId !== "string") redirect("/pro");

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== userId || typeof session.customer !== "string") {
    redirect("/pro");
  }
  const synced = await syncSubscription(session.customer);
  const active = isPro(synced?.subscription ?? null);

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PartyPopperIcon />
        </EmptyMedia>
        <EmptyTitle>{active ? "Welcome to Quairy Pro" : "Your payment is on its way"}</EmptyTitle>
        <EmptyDescription>
          {active
            ? "Your searches are unlimited now, and Quairy keeps your history."
            : "Stripe is still confirming your payment. Pro turns on as soon as it does."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild className="rounded-full">
          <Link href="/">Start searching</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
