import { clerkMiddleware } from "@clerk/nextjs/server";
import { JOIN_URL } from "@/lib/launch";

// Public-first: every page works signed out. Pages that need an account
// (Pro checkout, history) check for one themselves and offer sign-in.
// Sign-in redirects go to Quairy's own themed pages, not Clerk's hosted ones.
export default clerkMiddleware({ signInUrl: "/sign-in", signUpUrl: JOIN_URL });

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
