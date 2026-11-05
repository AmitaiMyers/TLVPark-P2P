"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { styles } from "@/components/ui";
import { assertLocale } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { he } from "@/i18n/dictionaries/he";

/**
 * Fallback for unexpected errors (the fail-fast paths). Error boundaries are
 * client components, so the two small dictionaries are imported directly.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ lang: string }>();
  const locale = assertLocale(params.lang);
  const text = { he, en }[locale].status;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={`${styles.page} items-center justify-center text-center`}>
      <h1 className={styles.heading}>{text.errorTitle}</h1>
      <p>{text.errorBody}</p>
      <button type="button" onClick={() => retry()} className={styles.buttonPrimary}>
        {text.retry}
      </button>
      <Link href={`/${locale}`} className="underline">
        {text.home}
      </Link>
    </main>
  );
}
