import type { Metadata } from "next";
import Link from "next/link";
import { Email, LegalPage, List, OperatorDetails, Section } from "@/components/LegalPage";
import { TERMS_UPDATED } from "@/lib/legal";
import {
  FREE_DAILY_EXTRAS,
  FREE_DAILY_SEARCHES,
  PRO_MONTHLY_EUR,
  PRO_YEARLY_EUR,
} from "@/lib/pricing";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" }, title: "Terms of service – Quairy" };

const link = "font-medium underline underline-offset-4";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated={TERMS_UPDATED}>
      <p>
        These terms apply when you use Quairy at quairy.me, with or without an account. By using
        Quairy, or by creating an account or subscribing to Quairy Pro, you agree to them. Our{" "}
        <Link href="/privacy" className={link}>
          privacy policy
        </Link>{" "}
        explains how we handle your data.
      </p>

      <Section title="Who we are">
        <OperatorDetails />
      </Section>

      <Section title="What Quairy does">
        <p>
          Quairy answers yes-or-no, pick-one and rating questions, compares options and answers
          questions about text you paste. Answers come from an AI model (Jev, made by TypeSafe) and
          show how sure Quairy is.
        </p>
        <p>
          Answers are automated judgments. They can be wrong or out of date, and they are not
          medical, legal, financial or other professional advice. Check anything important with a
          reliable source before you rely on it.
        </p>
      </Section>

      <Section title="Accounts">
        <p>
          You can use Quairy without an account. To create one you must be at least 13 years old,
          and to subscribe to Quairy Pro you must be 18 or have permission from a parent or
          guardian. Keep your sign-in details to yourself; you’re responsible for what happens in
          your account.
        </p>
      </Section>

      <Section title="Free use">
        <p>
          Without Pro, you can make {FREE_DAILY_SEARCHES} searches and {FREE_DAILY_EXTRAS}{" "}
          comparisons or text questions a day (UTC). Asking the same question again on the same
          day is free. We may change these limits.
        </p>
      </Section>

      <Section title="Quairy Pro">
        <List>
          <li>
            Quairy Pro costs €{PRO_MONTHLY_EUR} a month or €{PRO_YEARLY_EUR} a year. Prices
            include VAT where it applies. Payments are handled by Stripe.
          </li>
          <li>
            You pay in advance for each period. Your subscription renews automatically at the end
            of each period until you cancel it.
          </li>
          <li>
            You can cancel at any time in Settings › Subscription. Pro then stays on until the end
            of the period you’ve paid for, and you won’t be charged again.
          </li>
          <li>
            If you switch between monthly and yearly billing, the change takes effect right away:
            you’re charged for the new plan and credited for the unused part of the old one.
          </li>
          <li>
            If we change the price, we’ll tell you at least 30 days before it applies. The new
            price applies from your next renewal, and you can cancel before then.
          </li>
        </List>
      </Section>

      <Section title="Right of withdrawal">
        <p>
          If you’re a consumer, you can withdraw from your purchase within 14 days of subscribing,
          without giving a reason. When you subscribe, you ask for Pro to start right away. If you
          then withdraw within the 14 days, we refund what you paid, minus a proportionate amount
          for the days you had Pro.
        </p>
        <p>
          To withdraw, email <Email /> and say that you want to withdraw; any clear statement is
          enough. We refund you within 14 days, to the payment method you used.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>Please don’t:</p>
        <List>
          <li>use scripts, bots or other automated means to send questions or collect answers;</li>
          <li>get around the daily limits or rate limits, for example with many accounts;</li>
          <li>resell Quairy or its answers as a service;</li>
          <li>submit unlawful content, or content that infringes other people’s rights;</li>
          <li>try to disrupt Quairy or access parts of it you aren’t meant to.</li>
        </List>
        <p>
          We may limit, suspend or close access, including an account, that breaks these terms. If
          we close a paid account for this, we refund any period you’ve paid for and not used,
          unless the law allows otherwise.
        </p>
      </Section>

      <Section title="Your questions and text">
        <p>
          What you ask and paste stays yours. You allow us to process it to give you answers,
          which includes sending it to TypeSafe to produce them. Please don’t paste sensitive
          personal information, such as health details, about yourself or others.
        </p>
      </Section>

      <Section title="Changes and availability">
        <p>
          We work to keep Quairy available, but we can’t promise it will always be available or
          free of errors. We may change, add or remove features. If we stop offering Pro, we
          refund any period you’ve paid for and not used.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          Quairy is provided as is. To the extent the law allows, we aren’t liable for indirect
          losses, or for decisions you make based on Quairy’s answers. Nothing in these terms
          limits rights you have as a consumer that can’t be limited by agreement.
        </p>
      </Section>

      <Section title="Ending your account">
        <p>
          You can stop using Quairy at any time, and delete your account in Settings › Security.
          Cancel any subscription first, so you aren’t charged again.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          If we change these terms in a way that matters, we’ll say so on this page and, if you
          have an account, by email at least 30 days before the change applies. If you don’t
          agree, you can cancel and stop using Quairy before then.
        </p>
      </Section>

      <Section title="Law and disputes">
        <p>
          These terms are governed by Norwegian law. If you’re a consumer, you also keep the
          protection of the mandatory rules of the country where you live. If something goes
          wrong, contact us first at <Email />. If we can’t resolve it, consumers in Norway can
          get help from Forbrukerrådet, and consumers elsewhere from their national consumer body.
        </p>
      </Section>
    </LegalPage>
  );
}
