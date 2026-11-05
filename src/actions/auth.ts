"use server";

import { redirect } from "next/navigation";
import { assertLocale } from "@/i18n/config";
import { userError, type ActionResult } from "@/lib/actionResult";
import { endSession, safeReturnPath, startSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readOptionalString, readRequiredString } from "@/lib/form";

export async function signInAsUser(localeValue: string, returnPath: string | null, userId: string): Promise<void> {
  const locale = assertLocale(localeValue);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await startSession(user.id);
  redirect(safeReturnPath(locale, returnPath));
}

export async function registerUser(
  localeValue: string,
  returnPath: string | null,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(localeValue);
  const email = readRequiredString(formData, "email").toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing !== null) return userError("EMAIL_TAKEN");

  const user = await prisma.user.create({
    data: {
      name: readRequiredString(formData, "name"),
      email,
      phone: readOptionalString(formData, "phone"),
    },
  });
  await startSession(user.id);
  redirect(safeReturnPath(locale, returnPath));
}

export async function signOut(localeValue: string): Promise<void> {
  const locale = assertLocale(localeValue);
  await endSession();
  redirect(`/${locale}`);
}
