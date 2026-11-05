import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { RatingSummary } from "@/components/RatingSummary";
import { FEATURE_ICONS, FEATURE_KEYS, SpotFeatureBadges } from "@/components/SpotFeatureBadges";
import { ToggleChip } from "@/components/ToggleChip";
import { WhenPicker } from "@/components/WhenPicker";
import { SpotMap } from "@/components/map/SpotMap";
import { styles } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fillTemplate } from "@/i18n/template";
import type { UserErrorCode } from "@/lib/actionResult";
import { parseBookingWindow, suggestedWindowValues } from "@/lib/bookingWindow";
import { formatDateTimeRange, formatIls } from "@/lib/format";
import { readSearchParam, type RawSearchParams } from "@/lib/searchParams";
import { isVehicleSize, VEHICLE_SIZES, type VehicleSize } from "@/lib/vehicle";
import { searchSpots, type SearchFilters, type SpotSearchResult } from "@/server/spots";

/** Query-string keys for the feature checkboxes. */
const FEATURE_PARAMS = { isCovered: "covered", isGated: "gated", hasEvCharger: "ev" } as const;

type ParsedSearch =
  | { ok: true; filters: SearchFilters }
  | { ok: false; error: UserErrorCode };

/**
 * Reads the filters. Without times in the URL the search uses the next two
 * hours, so the first screen already answers "what's free right now?".
 */
function parseSearch(params: RawSearchParams, window: { start: string; end: string }, now: Date): ParsedSearch {
  const sizeParam = readSearchParam(params, "size");
  if (sizeParam !== null && !isVehicleSize(sizeParam)) throw new Error(`Unknown vehicle size "${sizeParam}"`);
  const vehicleSize: VehicleSize | null = sizeParam;
  const features = {
    isCovered: readSearchParam(params, FEATURE_PARAMS.isCovered) === "on",
    isGated: readSearchParam(params, FEATURE_PARAMS.isGated) === "on",
    hasEvCharger: readSearchParam(params, FEATURE_PARAMS.hasEvCharger) === "on",
  };
  const parsed = parseBookingWindow(window.start, window.end, now);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, filters: { window: parsed.window, vehicleSize, features } };
}

function SpotCard({
  spot,
  href,
  locale,
  dictionary,
}: {
  spot: SpotSearchResult;
  href: string;
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <li>
      <Link href={href} className={`${styles.card} flex flex-col gap-3 transition hover:border-brand active:scale-[0.99]`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="font-semibold leading-snug" dir="auto">
              {spot.title}
            </h3>
            <p className={`${styles.muted} flex items-center gap-1`}>
              <MapPin size={14} aria-hidden />
              <span dir="auto">{spot.addressLine}</span>
            </p>
          </div>
          <div className="shrink-0 text-end">
            <p className="text-xl font-bold text-accent">{formatIls(spot.totalPriceAgorot, locale)}</p>
            <p className={styles.muted}>
              {formatIls(spot.hourlyRateAgorot, locale)} {dictionary.common.perHour}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <SpotFeatureBadges spot={spot} sizeCategory={spot.sizeCategory} enums={dictionary.enums} />
          <RatingSummary ratings={spot.ratings} newLabel={dictionary.search.newSpot} />
        </div>
      </Link>
    </li>
  );
}

async function SearchContent({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await connection(); // "now" must be the request time, not build time.
  const now = new Date();
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const params = await searchParams;

  const suggested = suggestedWindowValues(now);
  const windowValues = {
    start: readSearchParam(params, "start") ?? suggested.start,
    end: readSearchParam(params, "end") ?? suggested.end,
  };
  const search = parseSearch(params, windowValues, now);
  const results = search.ok ? await searchSpots(search.filters) : [];
  const activeFilterCount =
    (readSearchParam(params, "size") === null ? 0 : 1) +
    FEATURE_KEYS.filter((key) => readSearchParam(params, FEATURE_PARAMS[key]) === "on").length;
  const spotQuery = new URLSearchParams(windowValues).toString();

  return (
    <main className={styles.page}>
      <h1 className="text-xl font-bold leading-snug">{dictionary.search.tagline}</h1>

      <form method="get" className={`${styles.card} flex flex-col gap-3`}>
        <WhenPicker
          locale={locale}
          text={dictionary.when}
          defaultStart={windowValues.start}
          defaultEnd={windowValues.end}
          nowMs={now.getTime()}
        />
        <details className="group" open={activeFilterCount > 0}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-accent">
            <SlidersHorizontal size={16} aria-hidden />
            {dictionary.search.filters}
            {activeFilterCount > 0 && <span className={styles.badge}>{activeFilterCount}</span>}
          </summary>
          <div className="flex flex-col gap-3 pt-2">
            <label className={styles.label}>
              {dictionary.search.vehicleSize}
              <select name="size" defaultValue={readSearchParam(params, "size") ?? ""} className={styles.input}>
                <option value="">{dictionary.search.anyVehicle}</option>
                {VEHICLE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {dictionary.enums.vehicleSize[size]}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">{dictionary.search.features}</legend>
              <div className="flex flex-wrap gap-2">
                {FEATURE_KEYS.map((key) => {
                  const Icon = FEATURE_ICONS[key];
                  return (
                    <ToggleChip
                      key={key}
                      name={FEATURE_PARAMS[key]}
                      label={dictionary.enums.feature[key]}
                      icon={<Icon size={16} aria-hidden />}
                      defaultChecked={readSearchParam(params, FEATURE_PARAMS[key]) === "on"}
                    />
                  );
                })}
              </div>
            </fieldset>
          </div>
        </details>
        <button type="submit" className={styles.buttonPrimary}>
          <Search size={18} aria-hidden />
          {dictionary.search.submit}
        </button>
      </form>

      {!search.ok && (
        <p role="alert" className={styles.error}>
          {dictionary.errors[search.error]}
        </p>
      )}

      {search.ok && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 className={styles.sectionTitle}>
              {fillTemplate(dictionary.search.resultsCount, { count: results.length })}
            </h2>
            <p className={styles.muted}>
              {formatDateTimeRange(search.filters.window.startsAt, search.filters.window.endsAt, locale)}
            </p>
          </div>
          <SpotMap
            viewLabel={dictionary.search.viewSpot}
            heightClassName="h-64"
            spots={results.map((spot) => ({
              id: spot.id,
              title: spot.title,
              latitude: spot.latitude,
              longitude: spot.longitude,
              priceLabel: formatIls(spot.totalPriceAgorot, locale),
              href: `/${locale}/spots/${spot.id}?${spotQuery}`,
            }))}
          />
          {results.length === 0 && <p className={`${styles.card} text-center`}>{dictionary.search.noResults}</p>}
          <ul className="flex flex-col gap-3">
            {results.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                href={`/${locale}/spots/${spot.id}?${spotQuery}`}
                locale={locale}
                dictionary={dictionary}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/[lang]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
