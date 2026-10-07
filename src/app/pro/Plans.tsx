import { CheckIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type BillingInterval,
  FREE_DAILY_EXTRAS,
  FREE_DAILY_SEARCHES,
  PRO_MONTHLY_EUR,
  PRO_YEARLY_EUR,
  YEARLY_SAVING_PERCENT,
} from "@/lib/pricing";

/** The form that subscribes; the billing period radios belong to it via `form`. */
export const SUBSCRIBE_FORM = "subscribe";

const PERIODS: { value: BillingInterval; label: string; price: string; per: string }[] = [
  { value: "month", label: "Monthly", price: `€${PRO_MONTHLY_EUR}`, per: "a month" },
  {
    value: "year",
    label: "Yearly",
    price: `€${PRO_YEARLY_EUR}`,
    per: `a year, €${(PRO_YEARLY_EUR / 12).toFixed(2)} a month`,
  },
];

function Price({ price, per }: { price: string; per: string }) {
  return (
    <>
      <span className="font-display text-3xl font-bold text-foreground">{price}</span> {per}
    </>
  );
}

/**
 * Monthly or yearly, as native radios so the choice works before any
 * JavaScript loads. The shown price follows the checked radio through
 * `group-has-*`, and the radios submit with the subscribe form.
 */
function PeriodChoice() {
  return (
    <fieldset className="flex w-fit rounded-full bg-muted p-1 text-sm">
      <legend className="sr-only">Billing period</legend>
      {PERIODS.map(({ value, label }) => (
        <label
          key={value}
          className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-muted-foreground has-checked:bg-card has-checked:text-foreground has-checked:shadow-sm has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
        >
          <input
            type="radio"
            name="interval"
            value={value}
            form={SUBSCRIBE_FORM}
            defaultChecked={value === "month"}
            className="sr-only"
          />
          {label}
          {value === "year" && (
            <span className="text-xs font-medium text-primary">−{YEARLY_SAVING_PERCENT}%</span>
          )}
        </label>
      ))}
    </fieldset>
  );
}

function Perks({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The Free and Pro plans. Everything here is the same for every visitor, so
 * the loading view renders it too; only `badge` and `footer` depend on the account.
 */
export function Plans({
  badge,
  footer,
  period,
}: {
  badge?: React.ReactNode;
  footer: React.ReactNode;
  /** A subscriber's billing period: show that price only, with no choice. */
  period?: BillingInterval;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Quairy Pro</h1>
        <p className="text-muted-foreground">
          Ask as much as you like, and pick up where you left off.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Free</CardTitle>
            <CardDescription>
              <span className="font-display text-3xl font-bold text-foreground">€0</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Perks
              items={[
                `${FREE_DAILY_SEARCHES} searches a day`,
                `${FREE_DAILY_EXTRAS} comparisons, text questions or source checks a day`,
                "No account needed",
              ]}
            />
          </CardContent>
        </Card>

        <Card className="group/pro border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              Pro {badge}
            </CardTitle>
            {period ? (
              <CardDescription>
                <Price {...PERIODS.find((p) => p.value === period)!} />
              </CardDescription>
            ) : (
              <>
                <CardDescription className="group-has-[input[value=year]:checked]/pro:hidden">
                  <Price {...PERIODS[0]} />
                </CardDescription>
                <CardDescription className="hidden group-has-[input[value=year]:checked]/pro:block">
                  <Price {...PERIODS[1]} />
                </CardDescription>
                <div className="pt-2">
                  <PeriodChoice />
                </div>
              </>
            )}
          </CardHeader>
          <CardContent>
            <Perks
              items={[
                "Unlimited searches",
                "Unlimited comparisons, text questions and source checks",
                "Search history",
                "Cancel any time",
              ]}
            />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">{footer}</CardFooter>
        </Card>
      </div>
    </div>
  );
}
