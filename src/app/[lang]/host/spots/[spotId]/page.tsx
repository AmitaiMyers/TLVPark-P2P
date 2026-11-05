import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  addAvailabilityException,
  addWeeklyRules,
  deleteAvailabilityException,
  deleteWeeklyRule,
} from "@/actions/availability";
import { setSpotListed, updateSpot } from "@/actions/spots";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { PageLoading } from "@/components/PageLoading";
import { SpotForm, type SpotFormValues } from "@/components/SpotForm";
import { TimeRangeInputs } from "@/components/TimeRangeInputs";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { styles } from "@/components/ui";
import type { ParkingSpot } from "@/generated/prisma/client";
import { backArrow } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { suggestedWindowValues } from "@/lib/bookingWindow";
import { prisma } from "@/lib/db";
import { EXCEPTION_KINDS } from "@/lib/enums";
import { formatDateTimeRange } from "@/lib/format";
import { formatMinuteOfDay, MINUTE_OF_DAY_OPTIONS } from "@/lib/time";
import { AGOROT_PER_SHEKEL } from "@/lib/pricing";
import { requireOwnedSpot } from "@/server/spots";

function toFormValues(spot: ParkingSpot): SpotFormValues {
  return {
    title: spot.title,
    description: spot.description,
    addressLine: spot.addressLine,
    latitude: spot.latitude,
    longitude: spot.longitude,
    spotType: spot.spotType,
    lengthCm: spot.lengthCm,
    widthCm: spot.widthCm,
    heightClearanceCm: spot.heightClearanceCm,
    isCovered: spot.isCovered,
    isGated: spot.isGated,
    hasEvCharger: spot.hasEvCharger,
    hourlyRateShekels: spot.hourlyRateAgorot / AGOROT_PER_SHEKEL,
    dailyCapShekels: spot.dailyCapAgorot / AGOROT_PER_SHEKEL,
    gatePhoneNumber: spot.gatePhoneNumber,
    accessInstructions: spot.accessInstructions,
  };
}

function MinuteSelect({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return (
    <label className={styles.label}>
      {label}
      <select name={name} defaultValue={defaultValue} className={styles.input} dir="ltr">
        {MINUTE_OF_DAY_OPTIONS.map((minute) => (
          <option key={minute} value={minute}>
            {formatMinuteOfDay(minute)}
          </option>
        ))}
      </select>
    </label>
  );
}

async function ManageSpotContent({ params }: { params: Promise<{ spotId: string }> }) {
  await connection();
  const now = new Date();
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const { spotId } = await params;
  const { spot } = await requireOwnedSpot(locale, spotId);

  const [rules, exceptions] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { spotId } }),
    prisma.availabilityException.findMany({ where: { spotId, endsAt: { gt: now } }, orderBy: { startsAt: "asc" } }),
  ]);
  const text = dictionary.availability;
  const suggested = suggestedWindowValues(now);

  return (
    <main className={styles.page}>
      <Link href={`/${locale}/host`} className="text-sm underline">
        {backArrow(locale)} {dictionary.host.title}
      </Link>
      <h1 className={styles.heading} dir="auto">{spot.title}</h1>

      <form
        action={setSpotListed.bind(null, locale, spot.id, !spot.isActive)}
        className={`${styles.card} flex items-center justify-between gap-3`}
      >
        <span>{spot.isActive ? dictionary.spotForm.listed : dictionary.host.unlisted}</span>
        <button type="submit" className={styles.buttonSecondary}>
          {spot.isActive ? dictionary.spotForm.unlist : dictionary.spotForm.relist}
        </button>
      </form>

      <section className={`${styles.card} flex flex-col gap-3`}>
        <h2 className={styles.sectionTitle}>{text.weeklyTitle}</h2>
        <p className={styles.muted}>{text.weeklyHint}</p>
        {rules.length === 0 ? (
          <p className="text-sm text-amber-700">{text.noRules}</p>
        ) : (
          <WeeklySchedule
            rules={rules}
            weekdays={dictionary.enums.weekdays}
            renderAction={(rule) => (
              <form action={deleteWeeklyRule.bind(null, locale, spot.id, rule.id)}>
                <button type="submit" aria-label={dictionary.common.delete} className="px-1 text-red-600">
                  ×
                </button>
              </form>
            )}
          />
        )}
        <ActionForm action={addWeeklyRules.bind(null, locale, spot.id)} errorMessages={dictionary.errors}>
          <fieldset className="flex flex-wrap gap-3 text-sm">
            <legend className="mb-1 font-medium">{text.days}</legend>
            {dictionary.enums.weekdays.map((weekday, dayOfWeek) => (
              <label key={weekday} className="flex items-center gap-1">
                <input type="checkbox" name="days" value={dayOfWeek} />
                {weekday}
              </label>
            ))}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <MinuteSelect name="startMinute" label={text.start} defaultValue={8 * 60} />
            <MinuteSelect name="endMinute" label={text.end} defaultValue={18 * 60} />
          </div>
          <SubmitButton className={styles.buttonSecondary}>{text.addWindow}</SubmitButton>
        </ActionForm>
      </section>

      <section className={`${styles.card} flex flex-col gap-3`}>
        <h2 className={styles.sectionTitle}>{text.exceptionsTitle}</h2>
        <p className={styles.muted}>{text.exceptionsHint}</p>
        {exceptions.length === 0 && <p className={styles.muted}>{text.noExceptions}</p>}
        <ul className="flex flex-col gap-2">
          {exceptions.map((exception) => (
            <li key={exception.id} className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className={styles.badge}>{dictionary.enums.exceptionKind[exception.kind]}</span>{" "}
                {formatDateTimeRange(exception.startsAt, exception.endsAt, locale)}
                {exception.note !== null && ` · ${exception.note}`}
              </span>
              <form action={deleteAvailabilityException.bind(null, locale, spot.id, exception.id)}>
                <button type="submit" className={styles.buttonDanger}>
                  {dictionary.common.delete}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <ActionForm action={addAvailabilityException.bind(null, locale, spot.id)} errorMessages={dictionary.errors}>
          <label className={styles.label}>
            {text.kind}
            <select name="kind" defaultValue="BLOCKED" className={styles.input}>
              {EXCEPTION_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {dictionary.enums.exceptionKind[kind]}
                </option>
              ))}
            </select>
          </label>
          <TimeRangeInputs
            startLabel={dictionary.common.from}
            endLabel={dictionary.common.until}
            defaultStart={suggested.start}
            defaultEnd={suggested.end}
            min={null}
            required
          />
          <label className={styles.label}>
            {text.note}
            <input name="note" maxLength={200} className={styles.input} />
          </label>
          <SubmitButton className={styles.buttonSecondary}>{text.addException}</SubmitButton>
        </ActionForm>
      </section>

      <SpotForm
        action={updateSpot.bind(null, locale, spot.id)}
        locale={locale}
        initial={toFormValues(spot)}
        submitLabel={dictionary.spotForm.save}
        successMessage={dictionary.spotForm.saved}
        dictionary={{ spotForm: dictionary.spotForm, enums: dictionary.enums, errors: dictionary.errors }}
      />
    </main>
  );
}

export default function ManageSpotPage({ params }: PageProps<"/[lang]/host/spots/[spotId]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <ManageSpotContent params={params} />
    </Suspense>
  );
}
