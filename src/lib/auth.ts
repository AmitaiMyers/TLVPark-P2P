import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/config";
import { prisma } from "./db";

/**
 * MOCK AUTHENTICATION (MVP only).
 *
 * The session is just the user's id in a cookie: anyone can sign in as any
 * user. This is intentional for the demo and must be replaced by real auth
 * before handling real money or real gate codes.
 */
export const SESSION_COOKIE = "tlvpark_user_id";

export async function getCurrentUser(): Promise<User | null> {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE);
  if (sessionCookie === undefined) return null;
  // A stale cookie (user deleted, database reset) counts as signed out.
  return prisma.user.findUnique({ where: { id: sessionCookie.value } });
}

/** Redirects to the login page, then back to `returnPath`, when signed out. */
export async function requireCurrentUser(locale: Locale, returnPath: string): Promise<User> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(returnPath)}`);
  }
  return user;
}

export async function startSession(userId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Only same-site relative paths are allowed as post-login destinations, so a
 * crafted ?next= link cannot bounce users to another site.
 */
export function safeReturnPath(locale: Locale, candidate: string | null): string {
  // Browsers treat "/\evil.com" like "//evil.com", so both prefixes are refused.
  const isSameSitePath =
    candidate !== null &&
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.startsWith("/\\");
  return isSameSitePath ? candidate : `/${locale}`;
}
