import { Car, ShieldCheck, Umbrella, Zap, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { VehicleSize } from "@/lib/vehicle";
import { styles } from "./ui";

export const FEATURE_KEYS = ["isCovered", "isGated", "hasEvCharger"] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_ICONS: Record<FeatureKey, LucideIcon> = {
  isCovered: Umbrella,
  isGated: ShieldCheck,
  hasEvCharger: Zap,
};

type FeatureFlags = Record<FeatureKey, boolean>;

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
      <li className={styles.badge}>
        <Car size={12} aria-hidden />
        {enums.vehicleSize[sizeCategory]}
      </li>
      {FEATURE_KEYS.filter((key) => spot[key]).map((key) => {
        const Icon = FEATURE_ICONS[key];
        return (
          <li key={key} className={styles.badge}>
            <Icon size={12} aria-hidden />
            {enums.feature[key]}
          </li>
        );
      })}
    </ul>
  );
}
