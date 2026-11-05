import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { cancelBooking } from "@/actions/bookings";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { PageLoading } from "@/components/PageLoading";
import { styles } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { bookingPhaseLabel } from "@/i18n/labels";
import { requireCurrentUser } from "@/lib/auth";
import { bookingPhase } from "@/lib/bookingPhase";
import { prisma } from "@/lib/db";
import { formatDateTimeRange, formatIls } from "@/lib/format";

/** Sum of confirmed booking totals on the host's spots, split by end time. */
async function hostEarnings(hostId: string, now: Date) {
  const confirmedOnMySpots = { status: "CONFIRMED" as const, spot: { hostId } };
  const [earned, upcoming] = await Promise.all([
    prisma.booking.aggregate({ where: { ...confirmedOnMySpots, endsAt: { lte: now } }, _sum: { totalPriceAgorot: true } }),
    prisma.booking.aggregate({ where: { ...confirmedOnMySpots, endsAt: { gt: now } }, _sum: { totalPriceAgorot: true } }),
  ]);
  // Prisma returns null for the sum of zero rows.
  return {
    earnedAgorot: earned._sum.totalPriceAgorot ?? 0,
    upcomingAgorot: upcoming._sum.totalPriceAgorot ?? 0,
  };
}

async function HostContent() {
  await connection();
  const now = new Date();
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const text = dictionary.host;
  const host = await requireCurrentUser(locale, `/${locale}/host`);

  const [earnings, spots, upcomingBookings] = await Promise.all([
    hostEarnings(host.id, now),
    prisma.parkingSpot.findMany({
      where: { hostId: host.id },
      include: {
        _count: { select: { availabilityRules: true } },
        availabilityExceptions: { where: { kind: "EXTRA", endsAt: { gt: now } }, select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { status: "CONFIRMED", endsAt: { gt: now }, spot: { hostId: host.id } },
      include: { spot: { select: { title: true } }, renter: { select: { name: true, phone: true } } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <main className={styles.page}>
      <div className="flex items-center justify-between gap-3">
        <h1 className={styles.heading}>{text.title}</h1>
        <Link href={`/${locale}/host/spots/new`} className={styles.buttonPrimary}>
          + {text.addSpot}
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className={styles.card}>
          <p className={styles.muted}>{text.earned}</p>
          <p className="text-2xl font-bold text-brand">{formatIls(earnings.earnedAgorot, locale)}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.muted}>{text.upcomingEarnings}</p>
          <p className="text-2xl font-bold">{formatIls(earnings.upcomingAgorot, locale)}</p>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={styles.sectionTitle}>{text.mySpots}</h2>
        {spots.length === 0 && <p className={styles.muted}>{text.noSpots}</p>}
        <ul className="flex flex-col gap-2">
          {spots.map((spot) => {
            const hasAvailability = spot._count.availabilityRules > 0 || spot.availabilityExceptions.length > 0;
            return (
              <li key={spot.id} className={`${styles.card} flex items-center justify-between gap-3`}>
                <div className="flex flex-col gap-1">
                  <p className="font-semibold" dir="auto">{spot.title}</p>
                  <p className={styles.muted}>
                    {spot.addressLine} · {formatIls(spot.hourlyRateAgorot, locale)} {dictionary.common.perHour}
                  </p>
                  {!spot.isActive && <span className={`${styles.badge} self-start`}>{text.unlisted}</span>}
                  {spot.isActive && !hasAvailability && <p className="text-sm text-amber-700">{text.noAvailability}</p>}
                </div>
                <Link href={`/${locale}/host/spots/${spot.id}`} className={styles.buttonSecondary}>
                  {text.edit}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={styles.sectionTitle}>{text.upcomingBookings}</h2>
        {upcomingBookings.length === 0 && <p className={styles.muted}>{text.noUpcomingBookings}</p>}
        <ul className="flex flex-col gap-2">
          {upcomingBookings.map((booking) => {
            const phase = bookingPhase(booking, now);
            return (
              <li key={booking.id} className={`${styles.card} flex flex-col gap-2`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold" dir="auto">{booking.spot.title}</p>
                    <p className={styles.muted}>{formatDateTimeRange(booking.startsAt, booking.endsAt, locale)}</p>
                    <p className="text-sm">
                      {dictionary.booking.renter}: {booking.renter.name}
                      {booking.renter.phone !== null && (
                        <>
                          {" · "}
                          <a href={`tel:${booking.renter.phone}`} className="underline" dir="ltr">
                            {booking.renter.phone}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-semibold">{formatIls(booking.totalPriceAgorot, locale)}</span>
                    <span className={styles.badge}>{bookingPhaseLabel(phase, dictionary.bookings)}</span>
                  </div>
                </div>
                {phase === "UPCOMING" && (
                  <ActionForm
                    action={cancelBooking.bind(null, locale, booking.id)}
                    errorMessages={dictionary.errors}
                    confirmMessage={text.cancelAsHostConfirm}
                  >
                    <SubmitButton className={`${styles.buttonDanger} self-start`}>{text.cancelAsHost}</SubmitButton>
                  </ActionForm>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

export default function HostPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <HostContent />
    </Suspense>
  );
}
