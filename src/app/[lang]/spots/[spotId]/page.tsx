import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { createBooking } from "@/actions/bookings";
import { CheckoutForm } from "@/components/CheckoutForm";
import { PageLoading } from "@/components/PageLoading";
import { SpotFeatureBadges } from "@/components/SpotFeatureBadges";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { SpotMap } from "@/components/map/SpotMap";
import { styles } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { fillTemplate } from "@/i18n/template";
import { getCurrentUser } from "@/lib/auth";
import { earliestStartValue, suggestedWindowValues } from "@/lib/bookingWindow";
import { prisma } from "@/lib/db";
import { formatAverageRating, formatIls } from "@/lib/format";
import { wazeNavigationUrl } from "@/lib/geo";
import { readSearchParam, type RawSearchParams } from "@/lib/searchParams";
import { deriveSpotSize } from "@/lib/vehicle";

async function SpotContent({
  params,
  searchParams,
}: {
  params: Promise<{ spotId: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  await connection();
  const now = new Date();
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const { spotId } = await params;
  const query = await searchParams;

  const [spot, reviews, user] = await Promise.all([
    prisma.parkingSpot.findUnique({
      where: { id: spotId },
      // Public page: access details are only for renters with a booking, so
      // they are never loaded here (and can't leak into client props).
      omit: { gatePhoneNumber: true, accessInstructions: true },
      include: { host: { select: { name: true } }, availabilityRules: true },
    }),
    prisma.review.findMany({
      where: { booking: { spotId } },
      include: { booking: { select: { renter: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    getCurrentUser(),
  ]);
  if (spot === null) notFound();

  const suggested = suggestedWindowValues(now);
  const defaultStart = readSearchParam(query, "start") ?? suggested.start;
  const defaultEnd = readSearchParam(query, "end") ?? suggested.end;
  const averageRating = formatAverageRating(reviews.map((review) => review.rating));
  const returnPath = `/${locale}/spots/${spotId}?${new URLSearchParams({ start: defaultStart, end: defaultEnd }).toString()}`;

  return (
    <main className={styles.page}>
      <header className="flex flex-col gap-2">
        <h1 className={styles.heading} dir="auto">{spot.title}</h1>
        <p className={styles.muted}>
          {spot.addressLine} · {fillTemplate(dictionary.spot.host, { name: spot.host.name })}
        </p>
        <SpotFeatureBadges spot={spot} sizeCategory={deriveSpotSize(spot)} enums={dictionary.enums} />
      </header>

      <SpotMap
        viewLabel={dictionary.search.viewSpot}
        center={[spot.latitude, spot.longitude]}
        zoom={16}
        heightClassName="h-56"
        spots={[
          {
            id: spot.id,
            title: spot.title,
            latitude: spot.latitude,
            longitude: spot.longitude,
            priceLabel: formatIls(spot.hourlyRateAgorot, locale),
            href: null,
          },
        ]}
      />

      <section className={`${styles.card} flex flex-col gap-2`}>
        <p className="text-xl font-bold text-brand">
          {formatIls(spot.hourlyRateAgorot, locale)} <span className="text-sm font-normal">{dictionary.common.perHour}</span>
        </p>
        <p className={styles.muted}>
          {fillTemplate(dictionary.common.dailyCap, { amount: formatIls(spot.dailyCapAgorot, locale) })}
        </p>
        <p dir="auto">{spot.description}</p>
        <p className="text-sm">
          {dictionary.enums.spotType[spot.spotType]} ·{" "}
          {fillTemplate(dictionary.spot.dimensions, { length: spot.lengthCm, width: spot.widthCm })} ·{" "}
          {spot.heightClearanceCm === null
            ? dictionary.spot.noHeightLimit
            : fillTemplate(dictionary.spot.heightLimit, { height: spot.heightClearanceCm })}
        </p>
        <a href={wazeNavigationUrl(spot)} target="_blank" rel="noreferrer" className="text-sm text-brand underline">
          {dictionary.common.navigateWithWaze}
        </a>
      </section>

      <section className={`${styles.card} flex flex-col gap-2`}>
        <h2 className={styles.sectionTitle}>{dictionary.spot.weeklySchedule}</h2>
        {spot.availabilityRules.length === 0 ? (
          <p className={styles.muted}>{dictionary.spot.noWeeklySchedule}</p>
        ) : (
          <WeeklySchedule rules={spot.availabilityRules} weekdays={dictionary.enums.weekdays} />
        )}
      </section>

      <section className={`${styles.card} flex flex-col gap-3`}>
        <h2 className={styles.sectionTitle}>{dictionary.checkout.title}</h2>
        {!spot.isActive && <p className={styles.error}>{dictionary.spot.unlisted}</p>}
        {spot.isActive && user === null && (
          <Link href={`/${locale}/login?next=${encodeURIComponent(returnPath)}`} className={styles.buttonPrimary}>
            {dictionary.checkout.signInToBook}
          </Link>
        )}
        {spot.isActive && user !== null && user.id === spot.hostId && (
          <p className={styles.muted}>{dictionary.checkout.ownSpot}</p>
        )}
        {spot.isActive && user !== null && user.id !== spot.hostId && (
          <CheckoutForm
            action={createBooking.bind(null, locale, spot.id)}
            locale={locale}
            pricing={{ hourlyRateAgorot: spot.hourlyRateAgorot, dailyCapAgorot: spot.dailyCapAgorot }}
            defaultStart={defaultStart}
            defaultEnd={defaultEnd}
            minStart={earliestStartValue(now)}
            dictionary={{ checkout: dictionary.checkout, common: dictionary.common, errors: dictionary.errors }}
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={styles.sectionTitle}>
          {dictionary.spot.reviews}{" "}
          {averageRating !== null && (
            <span className="text-base font-normal">
              {fillTemplate(dictionary.common.rating, { rating: averageRating, count: reviews.length })}
            </span>
          )}
        </h2>
        {reviews.length === 0 && <p className={styles.muted}>{dictionary.common.noRatings}</p>}
        <ul className="flex flex-col gap-2">
          {reviews.map((review) => (
            <li key={review.id} className={styles.card}>
              <p className="font-medium">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)} · {review.booking.renter.name}
              </p>
              {review.comment !== null && <p className="text-sm" dir="auto">{review.comment}</p>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default function SpotPage({ params, searchParams }: PageProps<"/[lang]/spots/[spotId]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <SpotContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
