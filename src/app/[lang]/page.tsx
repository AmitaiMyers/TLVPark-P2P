import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { SpotFeatureBadges, FEATURE_KEYS } from "@/components/SpotFeatureBadges";
import { TimeRangeInputs } from "@/components/TimeRangeInputs";
import { SpotMap } from "@/components/map/SpotMap";
import { styles } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fillTemplate } from "@/i18n/template";
import type { UserErrorCode } from "@/lib/actionResult";
import { earliestStartValue, parseBookingWindow, suggestedWindowValues } from "@/lib/bookingWindow";
import { formatAverageRating, formatIls } from "@/lib/format";
import { readSearchParam, type RawSearchParams } from "@/lib/searchParams";
import { isVehicleSize, VEHICLE_SIZES, type VehicleSize } from "@/lib/vehicle";
import { searchSpots, type SearchFilters, type SpotSearchResult } from "@/server/spots";

/** Query-string keys for the feature checkboxes. */
const FEATURE_PARAMS = { isCovered: "covered", isGated: "gated", hasEvCharger: "ev" } as const;

type ParsedSearch =
  | { ok: true; filters: SearchFilters; start: string | null; end: string | null }
  | { ok: false; error: UserErrorCode; start: string; end: string };

function parseSearch(params: RawSearchParams, now: Date): ParsedSearch {
  const sizeParam = readSearchParam(params, "size");
  if (sizeParam !== null && !isVehicleSize(sizeParam)) throw new Error(`Unknown vehicle size "${sizeParam}"`);
  const vehicleSize: VehicleSize | null = sizeParam;
  const features = {
    isCovered: readSearchParam(params, FEATURE_PARAMS.isCovered) === "on",
    isGated: readSearchParam(params, FEATURE_PARAMS.isGated) === "on",
    hasEvCharger: readSearchParam(params, FEATURE_PARAMS.hasEvCharger) === "on",
  };

  const start = readSearchParam(params, "start");
  const end = readSearchParam(params, "end");
  if (start === null || end === null) {
    return { ok: true, filters: { window: null, vehicleSize, features }, start: null, end: null };
  }
  const parsed = parseBookingWindow(start, end, now);
  if (!parsed.ok) return { ok: false, error: parsed.error, start, end };
  return { ok: true, filters: { window: parsed.window, vehicleSize, features }, start, end };
}

function spotHref(locale: Locale, spotId: string, start: string | null, end: string | null): string {
  const query = start === null || end === null ? "" : `?${new URLSearchParams({ start, end }).toString()}`;
  return `/${locale}/spots/${spotId}${query}`;
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
  const averageRating = formatAverageRating(spot.ratings);
  return (
    <li>
      <Link href={href} className={`${styles.card} flex flex-col gap-2`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold" dir="auto">{spot.title}</h3>
            <p className={styles.muted} dir="auto">{spot.addressLine}</p>
          </div>
          <div className="shrink-0 text-end">
            <p className="font-bold text-brand">
              {formatIls(spot.hourlyRateAgorot, locale)} <span className="text-xs font-normal">{dictionary.common.perHour}</span>
            </p>
            {spot.totalPriceAgorot !== null && (
              <p className="text-sm">
                {fillTemplate(dictionary.search.totalForWindow, { amount: formatIls(spot.totalPriceAgorot, locale) })}
              </p>
            )}
          </div>
        </div>
        <SpotFeatureBadges spot={spot} sizeCategory={spot.sizeCategory} enums={dictionary.enums} />
        <p className={styles.muted}>
          {averageRating === null
            ? dictionary.common.noRatings
            : fillTemplate(dictionary.common.rating, { rating: averageRating, count: spot.ratings.length })}
        </p>
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
  const search = parseSearch(params, now);
  const suggested = suggestedWindowValues(now);

  const filterDefaults = {
    start: search.start ?? suggested.start,
    end: search.end ?? suggested.end,
    size: readSearchParam(params, "size") ?? "",
  };
  const results = search.ok ? await searchSpots(search.filters) : [];
  const windowStart = search.ok ? search.start : null;
  const windowEnd = search.ok ? search.end : null;

  return (
    <main className={styles.page}>
      <p className="text-lg font-medium">{dictionary.search.tagline}</p>

      <form method="get" className={`${styles.card} flex flex-col gap-3`}>
        <h2 className={styles.sectionTitle}>{dictionary.search.filtersTitle}</h2>
        <TimeRangeInputs
          startLabel={dictionary.common.from}
          endLabel={dictionary.common.until}
          defaultStart={filterDefaults.start}
          defaultEnd={filterDefaults.end}
          min={earliestStartValue(now)}
          required
        />
        <label className={styles.label}>
          {dictionary.search.vehicleSize}
          <select name="size" defaultValue={filterDefaults.size} className={styles.input}>
            <option value="">{dictionary.search.anyVehicle}</option>
            {VEHICLE_SIZES.map((size) => (
              <option key={size} value={size}>
                {dictionary.enums.vehicleSize[size]}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <legend className="mb-1 font-medium">{dictionary.search.features}</legend>
          {FEATURE_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                name={FEATURE_PARAMS[key]}
                defaultChecked={readSearchParam(params, FEATURE_PARAMS[key]) === "on"}
              />
              {dictionary.enums.feature[key]}
            </label>
          ))}
        </fieldset>
        <button type="submit" className={styles.buttonPrimary}>
          {dictionary.search.submit}
        </button>
      </form>

      {!search.ok && (
        <p role="alert" className={styles.error}>
          {dictionary.errors[search.error]}
        </p>
      )}
      {search.ok && search.filters.window === null && <p className={styles.muted}>{dictionary.search.pickTimesHint}</p>}

      <SpotMap
        viewLabel={dictionary.search.viewSpot}
        spots={results.map((spot) => ({
          id: spot.id,
          title: spot.title,
          latitude: spot.latitude,
          longitude: spot.longitude,
          priceLabel: formatIls(spot.totalPriceAgorot ?? spot.hourlyRateAgorot, locale),
          href: spotHref(locale, spot.id, windowStart, windowEnd),
        }))}
      />

      <section className="flex flex-col gap-3">
        <h2 className={styles.sectionTitle}>{fillTemplate(dictionary.search.resultsCount, { count: results.length })}</h2>
        {results.length === 0 && search.ok && <p className={styles.muted}>{dictionary.search.noResults}</p>}
        <ul className="flex flex-col gap-3">
          {results.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              href={spotHref(locale, spot.id, windowStart, windowEnd)}
              locale={locale}
              dictionary={dictionary}
            />
          ))}
        </ul>
      </section>
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
