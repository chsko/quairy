import type { Metadata } from "next";
import Link from "next/link";
import { Email, LegalPage, List, OperatorDetails, Section } from "@/components/LegalPage";
import { PRIVACY_UPDATED } from "@/lib/legal";
import { HISTORY_SIZE } from "@/lib/pricing";

export const metadata: Metadata = { title: "Privacy policy – Quairy" };

const link = "font-medium underline underline-offset-4";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated={PRIVACY_UPDATED}>
      <p>
        This policy explains what personal data Quairy handles, why, and what rights you have. It
        applies together with our{" "}
        <Link href="/terms" className={link}>
          terms of service
        </Link>
        .
      </p>

      <Section title="Who is responsible">
        <OperatorDetails />
        <p>We are the controller of your personal data. Questions or requests go to the same address.</p>
      </Section>

      <Section title="What we handle, and why">
        <List>
          <li>
            <strong>Your questions and pasted text.</strong> We send them to TypeSafe so its model
            can answer. We don’t keep pasted text after answering. Questions appear in the page’s
            web address, so they can show up briefly in our hosting provider’s request logs. Why:
            to provide the service you ask for (contract).
          </li>
          <li>
            <strong>Search history (Quairy Pro).</strong> The questions you search for and when,
            up to the latest {HISTORY_SIZE}, so you can find them again. Why: it’s part of Pro
            (contract).
          </li>
          <li>
            <strong>Daily limits and abuse prevention.</strong> Your account ID, or your IP
            address if you’re signed out, with a scrambled fingerprint of each question, for up to
            48 hours. Your IP address is also counted for one minute to stop request floods. Why:
            to keep the free service fair and running (legitimate interest).
          </li>
          <li>
            <strong>Your account.</strong> Your email address, and a name and profile picture if
            you add them or sign in with another service, handled by Clerk. Why: to give you an
            account (contract).
          </li>
          <li>
            <strong>The waitlist.</strong> If you join it, your email address, handled by Clerk, so
            we can tell you when accounts and Quairy Pro open. We keep it until then, or until you
            ask us to remove it. Why: you asked us to (consent).
          </li>
          <li>
            <strong>Payments.</strong> Stripe processes your card and billing details; we never
            see your full card number. We keep your Stripe customer ID and your subscription’s
            status, plan and dates. Why: to provide Pro (contract) and keep accounting records
            (legal obligation).
          </li>
          <li>
            <strong>Preferences.</strong> Your time zone and time format. Why: to show times the
            way you want (contract).
          </li>
          <li>
            <strong>Usage statistics.</strong> Vercel Web Analytics and Speed Insights count page
            views and measure loading speed without cookies and without following you across
            sites. We also count searches, sign-ups and subscription changes, without your
            question or who you are, and estimate how many different people searched each day
            from a scrambled code that can’t be turned back into your account or IP address. We
            keep these counts for 120 days. Why: to understand and improve Quairy (legitimate
            interest).
          </li>
        </List>
        <p>We don’t sell your data, and we don’t use it for advertising.</p>
      </Section>

      <Section title="Cookies">
        <p>
          Quairy only uses the cookies that keep you signed in, set by Clerk. They’re needed for
          accounts to work, so we don’t ask for consent. There are no advertising or tracking
          cookies.
        </p>
      </Section>

      <Section title="Who processes data for us">
        <List>
          <li>Vercel: hosting, request logs and usage statistics.</li>
          <li>Clerk: accounts and sign-in.</li>
          <li>Stripe: payments and invoices.</li>
          <li>Upstash: the database for limits, history, preferences and subscriptions.</li>
          <li>TypeSafe: producing answers.</li>
        </List>
        <p>
          Some of them process data outside the EEA, including in the United States. Where they
          do, the transfer is covered by the EU–US Data Privacy Framework or by the European
          Commission’s standard contractual clauses.
        </p>
      </Section>

      <Section title="How long we keep it">
        <List>
          <li>Search history: until you clear it, or delete your account.</li>
          <li>Daily limit records: up to 48 hours.</li>
          <li>Account and preferences: until you delete your account.</li>
          <li>
            Payment records: as long as accounting law requires, which in Norway is generally
            five years.
          </li>
        </List>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask for a copy of your data, and ask us to correct it, delete it, restrict how
          we use it, or give it to you in a portable format. You can object to processing based
          on legitimate interest. Email <Email />; we answer within a month.
        </p>
        <p>
          You can clear your search history on the History page and delete your account in
          Settings › Security. If you think we handle your data unlawfully, you can complain to
          Datatilsynet, the Norwegian Data Protection Authority, or the authority where you live.
        </p>
      </Section>

      <Section title="Children">
        <p>Quairy isn’t meant for children under 13, and we don’t knowingly collect their data.</p>
      </Section>

      <Section title="Changes">
        <p>
          If we change this policy in a way that matters, we’ll update this page and, if you have
          an account, tell you by email.
        </p>
      </Section>
    </LegalPage>
  );
}
