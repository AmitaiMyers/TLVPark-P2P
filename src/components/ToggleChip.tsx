import type { ReactNode } from "react";

/**
 * A checkbox styled as a pill. The whole pill is the hit area (44px tall),
 * which is much easier to tap than a bare checkbox.
 */
export function ToggleChip({
  name,
  value,
  label,
  icon,
  defaultChecked,
}: {
  name: string;
  value?: string;
  label: string;
  icon?: ReactNode;
  defaultChecked: boolean;
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-full border border-black/15 px-4 text-sm font-medium transition-colors has-checked:border-brand has-checked:bg-brand has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-brand has-focus-visible:ring-offset-2 dark:border-white/20">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="sr-only" />
      {icon}
      {label}
    </label>
  );
}
