import { Mail, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LanguageSwitcher, SignOutButton } from "@/components/HeaderControls";
import { PageLoading } from "@/components/PageLoading";
import { styles } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth";

async function AccountContent() {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const text = dictionary.account;
  const user = await getCurrentUser();

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{text.title}</h1>

      {user === null ? (
        <section className={`${styles.card} flex flex-col gap-3`}>
          <p>{text.notSignedIn}</p>
          <Link href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/account`)}`} className={styles.buttonPrimary}>
            {dictionary.nav.login}
          </Link>
        </section>
      ) : (
        <section className={`${styles.card} flex flex-col gap-3`}>
          <p className="flex items-center gap-2 text-lg font-semibold">
            <UserRound size={20} aria-hidden /> {user.name}
          </p>
          <p className="flex items-center gap-2 text-sm" dir="ltr">
            <Mail size={16} aria-hidden /> {user.email}
          </p>
          {user.phone !== null && (
            <p className="flex items-center gap-2 text-sm" dir="ltr">
              <Phone size={16} aria-hidden /> {user.phone}
            </p>
          )}
          <p className={styles.muted}>{text.demoNotice}</p>
        </section>
      )}

      <section className={`${styles.card} flex items-center justify-between gap-3`}>
        <span className="font-medium">{text.language}</span>
        <Suspense fallback={null}>
          <LanguageSwitcher locale={locale} label={dictionary.language.switchTo} />
        </Suspense>
      </section>

      {user !== null && <SignOutButton locale={locale} label={dictionary.nav.logout} />}
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AccountContent />
    </Suspense>
  );
}
