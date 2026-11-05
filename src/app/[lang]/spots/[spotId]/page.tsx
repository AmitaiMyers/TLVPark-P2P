import { ArrowUpToLine, Car, Navigation, Ruler, Warehouse } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { createBooking } from "@/actions/bookings";
import { CheckoutForm } from "@/components/CheckoutForm";
import { PageLoading } from "@/components/PageLoading";
import { RatingSummary, StarRow } from "@/components/RatingSummary";
import { SpotFeatureBadges } from "@/components/SpotFeatureBadges";
import { WeeklyScheduleSummary } from "@/components/WeeklySchedule";
import { SpotMap } from "@/components/map/SpotMap";
import { styles } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { fillTemplate } from "@/i18n/template";
import { getCurrentUser } from "@/lib/auth";
import { suggestedWindowValues } from "@/lib/bookingWindow";
import { prisma } from "@/lib/db";
import { formatIls } from "@/lib/format";
import { wazeNavigationUrl } from "@/lib/geo";
import { readSearchParam, type RawSearchParams } from "@/lib/searchParams";
import { deriveSpotSize } from "@/lib/vehicle";

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-neutral-100 p-3 text-center dark:bg-neutral-800">
      <span className="text-accent">{icon}</span>
      <span className="text-xs text-neutral-600 dark:text-neutral-300">{label}</span>
      <span className="text-sm font-semibold leading-tight">{value}</span>
    </div>
  );
}

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
  const returnPath = `/${locale}/spots/${spotId}?${new URLSearchParams({ start: defaultStart, end: defaultEnd }).toString()}`;
  const text = dictionary.spot;
  const sizeCategory = deriveSpotSize(spot);

  return (
    <main className={styles.page}>
      <header className="flex flex-col gap-2">
        <h1 className={styles.heading} dir="auto">
          {spot.title}
        </h1>
        <p className={styles.muted}>
          <span dir="auto">{spot.addressLine}</span> · {fillTemplate(text.host, { name: spot.host.name })}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SpotFeatureBadges spot={spot} sizeCategory={sizeCategory} enums={dictionary.enums} />
          <RatingSummary ratings={reviews.map((review) => review.rating)} newLabel={dictionary.search.newSpot} />
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <Fact icon={<Warehouse size={20} aria-hidden />} label={text.type} value={dictionary.enums.spotType[spot.spotType]} />
        <Fact icon={<Car size={20} aria-hidden />} label={text.size} value={dictionary.enums.vehicleSize[sizeCategory]} />
        <Fact
          icon={<ArrowUpToLine size={20} aria-hidden />}
          label={text.height}
          value={
            spot.heightClearanceCm === null
              ? text.noHeightLimit
              : fillTemplate(text.heightValue, { height: spot.heightClearanceCm })
          }
        />
      </section>

      <section className={`${styles.card} flex flex-col gap-3`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={styles.sectionTitle}>{dictionary.checkout.title}</h2>
          <p className="text-sm">
            <strong className="text-accent">{formatIls(spot.hourlyRateAgorot, locale)}</strong> {dictionary.common.perHour}
            {" · "}
            {fillTemplate(dictionary.common.dailyCap, { amount: formatIls(spot.dailyCapAgorot, locale) })}
          </p>
        </div>
        {!spot.isActive && <p className={styles.error}>{text.unlisted}</p>}
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
            nowMs={now.getTime()}
            dictionary={{ checkout: dictionary.checkout, errors: dictionary.errors, when: dictionary.when }}
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <p className="whitespace-pre-line" dir="auto">
          {spot.description}
        </p>
        <p className={`${styles.muted} flex items-center gap-1`}>
          <Ruler size={14} aria-hidden />
          {fillTemplate(text.dimensions, { length: spot.lengthCm, width: spot.widthCm })}
        </p>
        <SpotMap
          viewLabel={dictionary.search.viewSpot}
          center={[spot.latitude, spot.longitude]}
          zoom={16}
          heightClassName="h-48"
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
        <a href={wazeNavigationUrl(spot)} target="_blank" rel="noreferrer" className={styles.buttonSecondary}>
          <Navigation size={18} aria-hidden />
          {dictionary.common.navigateWithWaze}
        </a>
      </section>

      <section className={`${styles.card} flex flex-col gap-3`}>
        <h2 className={styles.sectionTitle}>{text.weeklySchedule}</h2>
        {spot.availabilityRules.length === 0 ? (
          <p className={styles.muted}>{text.noWeeklySchedule}</p>
        ) : (
          <WeeklyScheduleSummary rules={spot.availabilityRules} weekdays={dictionary.enums.weekdays} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={styles.sectionTitle}>{text.reviews}</h2>
        {reviews.length === 0 && <p className={styles.muted}>{dictionary.common.noRatings}</p>}
        <ul className="flex flex-col gap-2">
          {reviews.map((review) => (
            <li key={review.id} className={`${styles.card} flex flex-col gap-1`}>
              <p className="flex items-center gap-2 font-medium">
                <StarRow rating={review.rating} />
                {review.booking.renter.name}
              </p>
              {review.comment !== null && (
                <p className="text-sm" dir="auto">
                  {review.comment}
                </p>
              )}
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
