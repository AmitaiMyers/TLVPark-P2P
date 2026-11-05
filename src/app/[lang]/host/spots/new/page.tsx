import { Suspense } from "react";
import { createSpot } from "@/actions/spots";
import { PageLoading } from "@/components/PageLoading";
import { SpotForm } from "@/components/SpotForm";
import { styles } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { requireCurrentUser } from "@/lib/auth";

async function NewSpotContent() {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  await requireCurrentUser(locale, `/${locale}/host/spots/new`);

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{dictionary.spotForm.newTitle}</h1>
      <SpotForm
        action={createSpot.bind(null, locale)}
        locale={locale}
        initial={null}
        submitLabel={dictionary.spotForm.create}
        dictionary={{ spotForm: dictionary.spotForm, enums: dictionary.enums, errors: dictionary.errors }}
      />
    </main>
  );
}

export default function NewSpotPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <NewSpotContent />
    </Suspense>
  );
}
