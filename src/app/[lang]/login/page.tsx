import { Suspense } from "react";
import { registerUser, signInAsUser } from "@/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { PageLoading } from "@/components/PageLoading";
import { styles } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { prisma } from "@/lib/db";
import { readSearchParam, type RawSearchParams } from "@/lib/searchParams";

async function LoginContent({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const returnPath = readSearchParam(await searchParams, "next");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{dictionary.login.title}</h1>
      <p className={styles.success}>{dictionary.login.mockNotice}</p>

      <section className={`${styles.card} flex flex-col gap-3`}>
        <h2 className={styles.sectionTitle}>{dictionary.login.demoUsers}</h2>
        <ul className="flex flex-col gap-2">
          {users.map((user) => (
            <li key={user.id}>
              <form action={signInAsUser.bind(null, locale, returnPath, user.id)}>
                <button type="submit" className={`${styles.buttonSecondary} w-full justify-between`}>
                  <span>{user.name}</span>
                  <span className="text-xs font-normal" dir="ltr">
                    {user.email}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${styles.card} flex flex-col gap-3`}>
        <h2 className={styles.sectionTitle}>{dictionary.login.newUser}</h2>
        <ActionForm action={registerUser.bind(null, locale, returnPath)} errorMessages={dictionary.errors}>
          <label className={styles.label}>
            {dictionary.login.name}
            <input name="name" required maxLength={80} className={styles.input} />
          </label>
          <label className={styles.label}>
            {dictionary.login.email}
            <input name="email" type="email" required dir="ltr" className={styles.input} />
          </label>
          <label className={styles.label}>
            {dictionary.login.phone}
            <input name="phone" type="tel" dir="ltr" className={styles.input} />
          </label>
          <SubmitButton>{dictionary.login.create}</SubmitButton>
        </ActionForm>
      </section>
    </main>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/[lang]/login">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
