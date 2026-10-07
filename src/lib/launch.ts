/**
 * What's open to the public. While Quairy gauges interest, new accounts go
 * through a waitlist (Clerk's sign-up mode must be "Waitlist" too, so Clerk
 * itself refuses sign-ups) and Pro shows as coming soon with checkout off.
 * Flip these, and Clerk's sign-up mode, to launch.
 */
export const SIGNUPS_OPEN = false;
export const PRO_OPEN = false;

/** Where people sign up, or join the waitlist while sign-ups are closed. */
export const JOIN_URL = SIGNUPS_OPEN ? "/sign-up" : "/waitlist";
