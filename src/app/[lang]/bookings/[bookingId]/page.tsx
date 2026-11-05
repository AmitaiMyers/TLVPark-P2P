import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { cancelBooking, submitReview } from "@/actions/bookings";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { PageLoading } from "@/components/PageLoading";
import { SaveBookingOffline } from "@/components/SaveBookingOffline";
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

const RATINGS = [1, 2, 3, 4, 5];

async function BookingContent({ params }: { params: Promise<{ bookingId: string }> }) {
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
  const { spot } = booking;
  const text = dictionary.booking;
  const phaseLabel = bookingPhaseLabel(phase, dictionary.bookings);

  return (
    <main className={styles.page}>
      <header className="flex flex-col gap-1">
        <p className={`${styles.badge} self-start`}>{phaseLabel}</p>
        <h1 className={styles.heading} dir="auto">{spot.title}</h1>
        <p className={styles.muted} dir="auto">{spot.addressLine}</p>
      </header>

      <section className={`${styles.card} flex flex-col gap-2`}>
        <p className="text-lg font-semibold">{formatDateTimeRange(booking.startsAt, booking.endsAt, locale)}</p>
        <p>
          {formatIls(booking.totalPriceAgorot, locale)} · {text.paid}
        </p>
        {booking.cancelledBy !== null && (
          <p className={styles.error}>
            {fillTemplate(text.cancelledBy, { party: text.cancelledByParty[booking.cancelledBy] })}
          </p>
        )}
        <a href={wazeNavigationUrl(spot)} target="_blank" rel="noreferrer" className="text-brand underline">
          {dictionary.common.navigateWithWaze}
        </a>
      </section>

      {canSeeAccessDetails(phase) && (
        <section className={`${styles.card} flex flex-col gap-3 border-brand`}>
          <h2 className={styles.sectionTitle}>{text.accessTitle}</h2>
          {spot.gatePhoneNumber !== null && (
            <div className="flex flex-col gap-1">
              <span className={styles.muted}>{text.gatePhone}</span>
              <a href={`tel:${spot.gatePhoneNumber}`} className={styles.buttonPrimary} dir="ltr">
                📞 {spot.gatePhoneNumber}
              </a>
              <span className="text-xs">{text.callGate}</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className={styles.muted}>{text.instructions}</span>
            <p className="whitespace-pre-line" dir="auto">{spot.accessInstructions}</p>
          </div>
          <p className="text-sm">
            {fillTemplate(dictionary.spot.host, { name: spot.host.name })}
            {spot.host.phone !== null && (
              <>
                {" · "}
                <a href={`tel:${spot.host.phone}`} className="underline" dir="ltr">
                  {spot.host.phone}
                </a>
              </>
            )}
          </p>
        </section>
      )}
      <SaveBookingOffline keepOffline={canSeeAccessDetails(phase)} savedLabel={text.savedOffline} />

      {phase === "UPCOMING" && (
        <ActionForm
          action={cancelBooking.bind(null, locale, booking.id)}
          errorMessages={dictionary.errors}
          confirmMessage={text.cancelConfirm}
        >
          <SubmitButton className={styles.buttonDanger}>{text.cancel}</SubmitButton>
        </ActionForm>
      )}

      {phase === "PAST" && booking.review === null && (
        <section className={`${styles.card} flex flex-col gap-3`}>
          <h2 className={styles.sectionTitle}>{text.reviewTitle}</h2>
          <ActionForm action={submitReview.bind(null, locale, booking.id)} errorMessages={dictionary.errors}>
            <fieldset className="flex gap-3 text-lg" dir="ltr">
              {RATINGS.map((rating) => (
                <label key={rating} className="flex items-center gap-1">
                  <input type="radio" name="rating" value={rating} required />
                  {rating}★
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
          <p>
            {"★".repeat(booking.review.rating)}
            {"☆".repeat(5 - booking.review.rating)}
          </p>
          {booking.review.comment !== null && <p className="text-sm" dir="auto">{booking.review.comment}</p>}
        </section>
      )}

      <Link href={`/${locale}/bookings`} className="text-sm underline">
        {backArrow(locale)} {dictionary.bookings.title}
      </Link>
    </main>
  );
}

export default function BookingPage({ params }: PageProps<"/[lang]/bookings/[bookingId]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <BookingContent params={params} />
    </Suspense>
  );
}
