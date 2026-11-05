import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { styles } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { bookingPhaseLabel } from "@/i18n/labels";
import { requireCurrentUser } from "@/lib/auth";
import { BOOKING_PHASES_IN_DISPLAY_ORDER, bookingPhase } from "@/lib/bookingPhase";
import { prisma } from "@/lib/db";
import { formatDateTimeRange, formatIls } from "@/lib/format";

async function BookingsContent() {
  await connection();
  const now = new Date();
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const user = await requireCurrentUser(locale, `/${locale}/bookings`);

  const bookings = await prisma.booking.findMany({
    where: { renterId: user.id },
    include: { spot: { select: { title: true, addressLine: true } } },
    orderBy: { startsAt: "asc" },
  });
  const groups = BOOKING_PHASES_IN_DISPLAY_ORDER.map((phase) => ({
    phase,
    bookings: bookings.filter((booking) => bookingPhase(booking, now) === phase),
  })).filter((group) => group.bookings.length > 0);

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>{dictionary.bookings.title}</h1>
      {groups.length === 0 && (
        <div className="flex flex-col gap-3">
          <p className={styles.muted}>{dictionary.bookings.empty}</p>
          <Link href={`/${locale}`} className={styles.buttonPrimary}>
            {dictionary.bookings.findParking}
          </Link>
        </div>
      )}
      {groups.map((group) => (
        <section key={group.phase} className="flex flex-col gap-2">
          <h2 className={styles.sectionTitle}>{bookingPhaseLabel(group.phase, dictionary.bookings)}</h2>
          <ul className="flex flex-col gap-2">
            {group.bookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/${locale}/bookings/${booking.id}`}
                  className={`${styles.card} flex items-center justify-between gap-3 ${group.phase === "ACTIVE" ? "border-brand" : ""}`}
                >
                  <div>
                    <p className="font-semibold" dir="auto">{booking.spot.title}</p>
                    <p className={styles.muted}>{formatDateTimeRange(booking.startsAt, booking.endsAt, locale)}</p>
                  </div>
                  <span className="shrink-0 font-semibold">{formatIls(booking.totalPriceAgorot, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <BookingsContent />
    </Suspense>
  );
}
