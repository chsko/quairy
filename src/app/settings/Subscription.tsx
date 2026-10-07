import Link from "next/link";
import { CreditCardIcon, ExternalLinkIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type BillingDetails, isPro } from "@/lib/billing";
import {
  FREE_DAILY_EXTRAS,
  FREE_DAILY_SEARCHES,
  PRO_MONTHLY_EUR,
  PRO_YEARLY_EUR,
  YEARLY_SAVING_PERCENT,
} from "@/lib/pricing";
import { PRO_OPEN } from "@/lib/launch";
import { resumeSubscription, switchInterval, updateCard } from "./actions";
import { CancelButton } from "./CancelButton";
import { SubmitButton } from "@/components/SubmitButton";

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: 0 }).format(
    cents / 100,
  );

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

function FreePlan({ ended }: { ended: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-display text-xl font-semibold">Free</p>
        <p className="text-sm text-muted-foreground">
          {ended ? "Your Pro subscription has ended. " : ""}
          {FREE_DAILY_SEARCHES} searches and {FREE_DAILY_EXTRAS} comparisons or text questions a day.
        </p>
      </div>
      <Button asChild className="w-fit rounded-full">
        <Link href="/pro">
          <SparklesIcon data-icon="inline-start" />
          {!PRO_OPEN ? "Pro is coming soon" : ended ? "Subscribe again" : "See Quairy Pro"}
        </Link>
      </Button>
    </div>
  );
}

const STATUS: Partial<Record<string, string>> = {
  trialing: "Trial",
  past_due: "Payment due",
  unpaid: "Unpaid",
  incomplete: "Incomplete",
};

/** The subscription tab: plan, renewal, billing period, card and invoices. */
export function SubscriptionSettings({
  billing,
  date,
}: {
  billing: BillingDetails | null;
  /** Formats a time in seconds as a date in the user's time zone. */
  date: (seconds: number) => string;
}) {
  if (!billing || !isPro(billing.subscription)) {
    return (
      <div className="flex flex-col gap-8">
        <FreePlan ended={!!billing} />
        {billing && <Invoices billing={billing} date={date} />}
      </div>
    );
  }

  const { subscription, card } = billing;
  const yearly = subscription.interval === "year";
  const ending = subscription.cancelAtPeriodEnd;
  const endsAt = ending ? (subscription.cancelAt ?? subscription.currentPeriodEnd) : null;
  const status = STATUS[subscription.status];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-xl font-semibold">Quairy Pro</p>
          {status ? <Badge variant="destructive">{status}</Badge> : <Badge>Active</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {money(billing.amount, billing.currency)} a {yearly ? "year" : "month"}.{" "}
          {subscription.status === "past_due"
            ? "Your last payment didn’t go through. Update your card to keep Pro."
            : ending && endsAt
              ? `Ends on ${date(endsAt)}.`
              : subscription.currentPeriodEnd
                ? `Renews on ${date(subscription.currentPeriodEnd)}.`
                : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ending ? (
            <form action={resumeSubscription}>
              <SubmitButton className="rounded-full" pendingLabel="Resuming…">
                Resume subscription
              </SubmitButton>
            </form>
          ) : (
            <>
              <form action={switchInterval}>
                <input type="hidden" name="interval" value={yearly ? "month" : "year"} />
                <SubmitButton
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  pendingLabel={yearly ? "Switching to monthly…" : "Switching to yearly…"}
                >
                  {yearly
                    ? `Switch to monthly (€${PRO_MONTHLY_EUR}/month)`
                    : `Switch to yearly (€${PRO_YEARLY_EUR}/year, save ${YEARLY_SAVING_PERCENT}%)`}
                </SubmitButton>
              </form>
              <CancelButton endsOn={subscription.currentPeriodEnd ? date(subscription.currentPeriodEnd) : null} />
            </>
          )}
        </div>
        {!ending && (
          <p className="mt-1 text-xs text-muted-foreground">
            Switching takes effect right away. You’re credited for the time left in this period.
          </p>
        )}
      </div>

      <Separator />

      <Section title="Payment method">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm">
            <CreditCardIcon className="size-4 text-muted-foreground" />
            {card ? (
              <span>
                <span className="capitalize">{card.brand}</span> ending in {card.last4}{" "}
                <span className="text-muted-foreground">
                  · expires {String(card.expMonth).padStart(2, "0")}/{card.expYear % 100}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">No card on file</span>
            )}
          </p>
          <form action={updateCard}>
            <SubmitButton variant="outline" size="sm" className="rounded-full" pendingLabel="Opening Stripe…">
              {card ? "Update card" : "Add card"}
            </SubmitButton>
          </form>
        </div>
      </Section>

      <Separator />

      <Invoices billing={billing} date={date} />
    </div>
  );
}

function Invoices({ billing, date }: { billing: BillingDetails; date: (seconds: number) => string }) {
  return (
    <Section title="Invoices">
      {billing.invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {billing.invoices.map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span>{date(invoice.created)}</span>
              <span className="ml-auto tabular-nums">{money(invoice.amount, invoice.currency)}</span>
              <span className="w-14 text-right text-xs text-muted-foreground capitalize">
                {invoice.status === "paid" ? "Paid" : invoice.status}
              </span>
              {invoice.url ? (
                <a
                  href={invoice.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                >
                  View
                  <ExternalLinkIcon className="size-3" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                <span className="w-10" />
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
