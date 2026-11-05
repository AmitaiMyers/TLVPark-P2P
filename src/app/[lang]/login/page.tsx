import { Suspense } from "react";
import { registerUser, signInAsUser } from "@/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { PageLoading } from "@/components/PageLoading";
import { styles } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { prisma } from "@/lib/db";
import { readSearchParam, type RawSearchParams } from "@/lib/searchParams";
import { fillTemplate } from "@/i18n/template";

/** "Noa Levi" -> "NL" */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

async function LoginContent({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const returnPath = readSearchParam(await searchParams, "next");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { spots: true } } },
  });

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
                <button
                  type="submit"
                  className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-black/10 px-3 text-start transition hover:border-brand active:scale-[0.99] dark:border-white/15"
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white"
                    aria-hidden
                  >
                    {initials(user.name)}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">{user.name}</span>
                    <span className={styles.muted}>
                      {user._count.spots > 0
                        ? fillTemplate(dictionary.login.hostOf, { count: user._count.spots })
                        : dictionary.login.renter}
                    </span>
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
