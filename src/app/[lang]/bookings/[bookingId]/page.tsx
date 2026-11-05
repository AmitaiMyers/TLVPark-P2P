import { CalendarClock, CircleCheck, KeyRound, Navigation, Phone, Receipt, Star, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { cancelBooking, submitReview } from "@/actions/bookings";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { PageLoading } from "@/components/PageLoading";
import { StarRow } from "@/components/RatingSummary";
import { SaveBookingOffline } from "@/components/SaveBookingOffline";
import { InstallHint } from "@/components/StatusBanners";
import { styles } from "@/components/ui";
import { backArrow } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { bookingPhaseLabel } from "@/i18n/labels";
import { fillTemplate } from "@/i18n/template";
import { requireCurrentUser } from "@/lib/auth";
import { bookingPhase, canSeeAccessDetails } from "@/lib/bookingPhase";
import { prisma } from "@/lib/db";
import { formatDateTimeRange, formatIls } from "@/lib/format";
import { wazeNavigationUrl } from "@/lib/geo";
import { readSearchParam, type RawSearchParams } from "@/lib/searchParams";

const RATINGS = [1, 2, 3, 4, 5];

async function BookingContent({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  await connection();
  const now = new Date();
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const { bookingId } = await params;
  const user = await requireCurrentUser(locale, `/${locale}/bookings/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { spot: { include: { host: { select: { name: true, phone: true } } } }, review: true },
  });
  // Someone else's booking answers 404, so its existence is not revealed.
  if (booking === null || booking.renterId !== user.id) notFound();

  const phase = bookingPhase(booking, now);
  const justBooked = readSearchParam(await searchParams, "confirmed") === "1";
  const { spot } = booking;
  const text = dictionary.booking;
  const phaseLabel = bookingPhaseLabel(phase, dictionary.bookings);

  return (
    <main className={styles.page}>
      {justBooked && phase !== "CANCELLED" && (
        <p role="status" className={`${styles.success} text-base font-semibold`}>
          <CircleCheck size={20} className="inline align-text-bottom" aria-hidden /> {text.confirmed}
        </p>
      )}
      <header className="flex flex-col gap-1">
        <p className={`${styles.badge} self-start`}>{phaseLabel}</p>
        <h1 className={styles.heading} dir="auto">{spot.title}</h1>
        <p className={styles.muted} dir="auto">{spot.addressLine}</p>
      </header>

      {canSeeAccessDetails(phase) && (
        <section className={`${styles.card} flex flex-col gap-4 border-2 border-brand`}>
          <h2 className={`${styles.sectionTitle} flex items-center gap-2`}>
            <KeyRound size={20} className="text-accent" aria-hidden />
            {text.accessTitle}
          </h2>
          <div className={`grid gap-2 ${spot.gatePhoneNumber === null ? "grid-cols-1" : "grid-cols-2"}`}>
            {spot.gatePhoneNumber !== null && (
              <a href={`tel:${spot.gatePhoneNumber}`} className={`${styles.buttonPrimary} flex-col gap-0.5`}>
                <span className="flex items-center gap-2">
                  <Phone size={18} aria-hidden />
                  {text.callGate}
                </span>
                <span className="text-xs font-normal opacity-90" dir="ltr">
                  {spot.gatePhoneNumber}
                </span>
              </a>
            )}
            <a href={wazeNavigationUrl(spot)} target="_blank" rel="noreferrer" className={styles.buttonSecondary}>
              <Navigation size={18} aria-hidden />
              {text.navigate}
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <span className={styles.muted}>{text.instructions}</span>
            <p className="whitespace-pre-line text-base" dir="auto">
              {spot.accessInstructions}
            </p>
          </div>
          <p className="text-sm">
            {fillTemplate(dictionary.spot.host, { name: spot.host.name })}
            {spot.host.phone !== null && (
              <>
                {" · "}
                <a href={`tel:${spot.host.phone}`} className="whitespace-nowrap underline" dir="ltr">
                  {spot.host.phone}
                </a>
              </>
            )}
          </p>
        </section>
      )}
      <SaveBookingOffline keepOffline={canSeeAccessDetails(phase)} savedLabel={text.savedOffline} />
      {canSeeAccessDetails(phase) && (
        <InstallHint
          title={dictionary.status.installTitle}
          body={dictionary.status.installIos}
          dismissLabel={dictionary.status.dismiss}
        />
      )}

      <section className={`${styles.card} flex flex-col gap-2`}>
        <p className="flex items-center gap-2 text-lg font-semibold">
          <CalendarClock size={20} className="text-accent" aria-hidden />
          {formatDateTimeRange(booking.startsAt, booking.endsAt, locale)}
        </p>
        <p className="flex items-center gap-2">
          <Receipt size={18} className="text-neutral-500" aria-hidden />
          {formatIls(booking.totalPriceAgorot, locale)} · {text.paid}
        </p>
        {booking.cancelledBy !== null && (
          <p className={styles.error}>
            {fillTemplate(text.cancelledBy, { party: text.cancelledByParty[booking.cancelledBy] })}
          </p>
        )}
        {!canSeeAccessDetails(phase) && (
          <a href={wazeNavigationUrl(spot)} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
            {dictionary.common.navigateWithWaze}
          </a>
        )}
      </section>

      {phase === "UPCOMING" && (
        <ActionForm
          action={cancelBooking.bind(null, locale, booking.id)}
          errorMessages={dictionary.errors}
          confirmMessage={text.cancelConfirm}
        >
          <SubmitButton className={`${styles.buttonDanger} w-full`}>
            <XCircle size={18} aria-hidden />
            {text.cancel}
          </SubmitButton>
        </ActionForm>
      )}

      {phase === "PAST" && booking.review === null && (
        <section className={`${styles.card} flex flex-col gap-3`}>
          <h2 className={styles.sectionTitle}>{text.reviewTitle}</h2>
          <ActionForm action={submitReview.bind(null, locale, booking.id)} errorMessages={dictionary.errors}>
            <fieldset className="flex flex-wrap gap-2" dir="ltr">
              <legend className="sr-only">{text.reviewTitle}</legend>
              {RATINGS.map((rating) => (
                <label
                  key={rating}
                  className="inline-flex min-h-11 min-w-14 cursor-pointer items-center justify-center gap-1 rounded-full border border-black/15 px-3 font-semibold has-checked:border-amber-500 has-checked:bg-amber-100 has-focus-visible:ring-2 has-focus-visible:ring-brand dark:border-white/20 dark:has-checked:bg-amber-900"
                >
                  <input type="radio" name="rating" value={rating} required className="sr-only" />
                  {rating}
                  <Star size={16} className="fill-amber-400 text-amber-400" aria-hidden />
                </label>
              ))}
            </fieldset>
            <label className={styles.label}>
              {text.reviewComment}
              <textarea name="comment" rows={3} maxLength={1000} className={styles.input} />
            </label>
            <SubmitButton>{text.submitReview}</SubmitButton>
          </ActionForm>
        </section>
      )}
      {booking.review !== null && (
        <section className={`${styles.card} flex flex-col gap-1`}>
          <h2 className={styles.sectionTitle}>{text.yourReview}</h2>
          <StarRow rating={booking.review.rating} size={18} />
          {booking.review.comment !== null && <p className="text-sm" dir="auto">{booking.review.comment}</p>}
        </section>
      )}

      <Link href={`/${locale}/bookings`} className="text-sm underline">
        {backArrow(locale)} {dictionary.bookings.title}
      </Link>
    </main>
  );
}

export default function BookingPage({ params, searchParams }: PageProps<"/[lang]/bookings/[bookingId]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <BookingContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
