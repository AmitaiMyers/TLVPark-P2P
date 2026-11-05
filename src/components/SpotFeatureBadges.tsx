import type { Dictionary } from "@/i18n/dictionaries/en";
import type { VehicleSize } from "@/lib/vehicle";
import { styles } from "./ui";

export const FEATURE_KEYS = ["isCovered", "isGated", "hasEvCharger"] as const;

type FeatureFlags = Record<(typeof FEATURE_KEYS)[number], boolean>;

/** Size category + feature badges, shared by search cards and the spot page. */
export function SpotFeatureBadges({
  spot,
  sizeCategory,
  enums,
}: {
  spot: FeatureFlags;
  sizeCategory: VehicleSize;
  enums: Dictionary["enums"];
}) {
  return (
    <ul className="flex flex-wrap gap-1">
      <li className={styles.badge}>{enums.vehicleSize[sizeCategory]}</li>
      {FEATURE_KEYS.filter((key) => spot[key]).map((key) => (
        <li key={key} className={styles.badge}>
          {enums.feature[key]}
        </li>
      ))}
    </ul>
  );
}
