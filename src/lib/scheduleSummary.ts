import type { WeeklyRule } from "./availability";

export type ScheduleGroup = {
  /** First and last weekday (0 = Sunday) of a run of identical days. */
  firstDay: number;
  lastDay: number;
  windows: { startMinute: number; endMinute: number }[];
};

function windowsOfDay(rules: WeeklyRule[], dayOfWeek: number) {
  return rules
    .filter((rule) => rule.dayOfWeek === dayOfWeek)
    .map(({ startMinute, endMinute }) => ({ startMinute, endMinute }))
    .sort((a, b) => a.startMinute - b.startMinute);
}

/**
 * Compresses a weekly schedule for display: consecutive days with identical
 * windows merge, e.g. five "08:00-18:00" days become one "Sun-Thu" row.
 * Days without windows are omitted.
 */
export function summarizeWeeklySchedule(rules: WeeklyRule[]): ScheduleGroup[] {
  const groups: ScheduleGroup[] = [];
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const windows = windowsOfDay(rules, dayOfWeek);
    if (windows.length === 0) continue;

    const previous = groups.at(-1);
    const continuesPrevious =
      previous !== undefined &&
      previous.lastDay === dayOfWeek - 1 &&
      JSON.stringify(previous.windows) === JSON.stringify(windows);
    if (continuesPrevious) {
      previous.lastDay = dayOfWeek;
    } else {
      groups.push({ firstDay: dayOfWeek, lastDay: dayOfWeek, windows });
    }
  }
  return groups;
}
