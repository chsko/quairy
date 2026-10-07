"use client";

import { UserProfile } from "@clerk/nextjs";
import { CreditCardIcon, SlidersHorizontalIcon } from "lucide-react";
import { SettingsSkeleton } from "./SettingsSkeleton";

/**
 * Clerk's account and security pages, with Quairy's own subscription and
 * preferences pages alongside them in the same dashboard.
 */
export function Profile({
  subscription,
  preferences,
}: {
  subscription: React.ReactNode;
  preferences: React.ReactNode;
}) {
  return (
    <UserProfile
      fallback={<SettingsSkeleton />}
      path="/settings"
      routing="path"
      // Clerk's own styles outrank utility classes, so size it with style objects:
      // as wide as the page column, outlined rather than floating.
      appearance={{
        elements: {
          rootBox: { width: "100%" },
          cardBox: {
            width: "100%",
            maxWidth: "none",
            boxShadow: "none",
            border: "1px solid var(--border)",
          },
        },
      }}
    >
      <UserProfile.Page
        label="Subscription"
        url="subscription"
        labelIcon={<CreditCardIcon className="size-4" />}
      >
        {subscription}
      </UserProfile.Page>
      <UserProfile.Page
        label="Preferences"
        url="preferences"
        labelIcon={<SlidersHorizontalIcon className="size-4" />}
      >
        {preferences}
      </UserProfile.Page>
    </UserProfile>
  );
}
