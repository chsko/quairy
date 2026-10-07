import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubscription, isPro, type Subscription } from "@/lib/billing";
import { PRO_OPEN } from "@/lib/launch";
import { subscribe } from "./actions";
import { Plans, SUBSCRIBE_FORM } from "./Plans";

export const metadata: Metadata = { title: "Quairy Pro" };

const date = new Intl.DateTimeFormat("en", { dateStyle: "long" });

function Renewal({ subscription }: { subscription: Subscription }) {
  if (subscription.status === "past_due") {
    return <>Your last payment didn’t go through. Update your card to keep Pro.</>;
  }
  const at = subscription.cancelAtPeriodEnd
    ? (subscription.cancelAt ?? subscription.currentPeriodEnd)
    : subscription.currentPeriodEnd;
  if (!at) return null;
  const when = date.format(new Date(at * 1000));
  return subscription.cancelAtPeriodEnd ? <>Pro ends on {when}.</> : <>Renews on {when}.</>;
}

export default async function ProPage() {
  const { userId } = await auth();
  const subscription = userId ? await getSubscription(userId) : null;
  const pro = isPro(subscription);

  return (
    <Plans
      badge={
        pro ? <Badge>Your plan</Badge> : !PRO_OPEN && <Badge variant="secondary">Coming soon</Badge>
      }
      period={pro ? (subscription!.interval ?? "month") : undefined}
      footer={
        pro ? (
          <>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/settings/subscription">Manage subscription</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <Renewal subscription={subscription!} />
            </p>
          </>
        ) : !PRO_OPEN ? (
          <>
            <Button asChild className="w-full rounded-full">
              <Link href="/waitlist">Get notified when Pro opens</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Pro isn’t available yet. Join the waitlist and we’ll email you when it opens.
            </p>
          </>
        ) : (
          <>
            {userId ? (
              <form id={SUBSCRIBE_FORM} action={subscribe}>
                <Button type="submit" className="w-full rounded-full">
                  Subscribe
                </Button>
              </form>
            ) : (
              // A plain link, so the (prefetched) sign-up page opens at once; it
              // returns here afterwards to subscribe.
              <Button asChild className="w-full rounded-full">
                <Link href={`/sign-up?${new URLSearchParams({ redirect_url: "/pro" })}`}>
                  Sign up to subscribe
                </Link>
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Renews automatically until you cancel. Paid securely with Stripe. By subscribing you
              agree to the{" "}
              <Link href="/terms" className="underline underline-offset-4">
                terms
              </Link>
              .
            </p>
          </>
        )
      }
    />
  );
}
