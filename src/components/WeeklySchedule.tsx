import type { ReactNode } from "react";
import { formatMinuteOfDay } from "@/lib/time";

export type ScheduleRule = { id: string; dayOfWeek: number; startMinute: number; endMinute: number };

/** "08:00–18:00" */
export function formatRuleWindow(rule: ScheduleRule): string {
  return `${formatMinuteOfDay(rule.startMinute)}–${formatMinuteOfDay(rule.endMinute)}`;
}

/**
 * Rules grouped by weekday (Sunday first). `renderAction` lets the host page
 * add a delete button next to each window; the public page passes nothing.
 */
export function WeeklySchedule({
  rules,
  weekdays,
  renderAction,
}: {
  rules: ScheduleRule[];
  weekdays: string[];
  renderAction?: (rule: ScheduleRule) => ReactNode;
}) {
  const days = weekdays
    .map((name, dayOfWeek) => ({
      name,
      rules: rules
        .filter((rule) => rule.dayOfWeek === dayOfWeek)
        .sort((a, b) => a.startMinute - b.startMinute),
    }))
    .filter((day) => day.rules.length > 0);

  return (
    <ul className="flex flex-col gap-1 text-sm">
      {days.map((day) => (
        <li key={day.name} className="flex flex-wrap items-center gap-2">
          <span className="w-16 font-medium">{day.name}</span>
          {day.rules.map((rule) => (
            <span key={rule.id} className="flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 dark:bg-neutral-800">
              <span dir="ltr">{formatRuleWindow(rule)}</span>
              {renderAction?.(rule)}
            </span>
          ))}
        </li>
      ))}
    </ul>
  );
}
