import type { ReactNode } from "react";
import { summarizeWeeklySchedule } from "@/lib/scheduleSummary";
import { formatMinuteOfDay } from "@/lib/time";

export type ScheduleRule = { id: string; dayOfWeek: number; startMinute: number; endMinute: number };

/** "08:00–18:00" */
function formatWindow(window: { startMinute: number; endMinute: number }): string {
  return `${formatMinuteOfDay(window.startMinute)}–${formatMinuteOfDay(window.endMinute)}`;
}

const windowChip = "flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 dark:bg-neutral-800";

/** Public view: identical consecutive days merged ("Sunday–Thursday 08:00–18:00"). */
export function WeeklyScheduleSummary({ rules, weekdays }: { rules: ScheduleRule[]; weekdays: string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {summarizeWeeklySchedule(rules).map((group) => (
        <li key={group.firstDay} className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">
            {group.firstDay === group.lastDay
              ? weekdays[group.firstDay]
              : `${weekdays[group.firstDay]}–${weekdays[group.lastDay]}`}
          </span>
          <span className="flex flex-wrap gap-1">
            {group.windows.map((window) => (
              <span key={window.startMinute} className={windowChip} dir="ltr">
                {formatWindow(window)}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Host view: one chip per stored rule, each with its own action (delete). */
export function WeeklySchedule({
  rules,
  weekdays,
  renderAction,
}: {
  rules: ScheduleRule[];
  weekdays: string[];
  renderAction: (rule: ScheduleRule) => ReactNode;
}) {
  const days = weekdays
    .map((name, dayOfWeek) => ({
      name,
      rules: rules.filter((rule) => rule.dayOfWeek === dayOfWeek).sort((a, b) => a.startMinute - b.startMinute),
    }))
    .filter((day) => day.rules.length > 0);

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {days.map((day) => (
        <li key={day.name} className="flex flex-wrap items-center gap-2">
          <span className="w-16 font-medium">{day.name}</span>
          {day.rules.map((rule) => (
            <span key={rule.id} className={windowChip}>
              <span dir="ltr">{formatWindow(rule)}</span>
              {renderAction(rule)}
            </span>
          ))}
        </li>
      ))}
    </ul>
  );
}
