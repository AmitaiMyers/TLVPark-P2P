import Link from "next/link";
import { styles } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function NotFoundPage() {
  const locale = await getLocale();
  const text = (await getDictionary()).status;
  return (
    <main className={`${styles.page} items-center justify-center text-center`}>
      <p className="text-5xl" aria-hidden>
        🅿️
      </p>
      <h1 className={styles.heading}>{text.notFoundTitle}</h1>
      <p>{text.notFoundBody}</p>
      <Link href={`/${locale}`} className={styles.buttonPrimary}>
        {text.home}
      </Link>
    </main>
  );
}
