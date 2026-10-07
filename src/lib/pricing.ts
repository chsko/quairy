/** Free searches per visitor per day (UTC). Asking the same question again is free. */
export const FREE_DAILY_SEARCHES = 10;
/**
 * Free comparisons and questions about a pasted text, together, per visitor per
 * day (UTC). They cost up to 10x a search, so they have their own, smaller limit.
 */
export const FREE_DAILY_EXTRAS = 3;
/**
 * Pro's fair-use cap on the same requests, per subscriber per day (UTC). Far
 * above personal use; it stops one account from running up web search and Jev
 * costs beyond what it pays.
 */
export const PRO_DAILY_EXTRAS = 200;
/** Quairy Pro, per month, in euros. */
export const PRO_MONTHLY_EUR = 4;
/** Quairy Pro, per year, in euros. */
export const PRO_YEARLY_EUR = 30;
export const PRO_PRICE_LABEL = `€${PRO_MONTHLY_EUR}/month`;
/** How much the yearly plan saves over twelve months, as a whole percentage. */
export const YEARLY_SAVING_PERCENT = Math.round((1 - PRO_YEARLY_EUR / (PRO_MONTHLY_EUR * 12)) * 100);

export type BillingInterval = "month" | "year";
/** Searches a subscriber's history keeps. */
export const HISTORY_SIZE = 200;
