import { MINUTES_PER_DAY, rangesOverlap } from "./time";

export type RuleWindow = { dayOfWeek: number; startMinute: number; endMinute: number };

/**
 * One window per selected day. An end at or before the start means
 * "overnight": Sunday 22:00-06:00 becomes Sun 22:00-24:00 + Mon 00:00-06:00
 * (Saturday night continues into Sunday). Throws on a zero-length window.
 */
export function windowsForDays(days: number[], startMinute: number, endMinute: number): RuleWindow[] {
  if (startMinute === endMinute) throw new Error("A weekly window cannot start and end at the same time");
  if (endMinute > startMinute) {
    return days.map((dayOfWeek) => ({ dayOfWeek, startMinute, endMinute }));
  }
  return days.flatMap((dayOfWeek) => {
    const evening = { dayOfWeek, startMinute, endMinute: MINUTES_PER_DAY };
    const nextMorning = { dayOfWeek: (dayOfWeek + 1) % 7, startMinute: 0, endMinute };
    return endMinute === 0 ? [evening] : [evening, nextMorning];
  });
}

export function windowsOverlap(a: RuleWindow, b: RuleWindow): boolean {
  return a.dayOfWeek === b.dayOfWeek && rangesOverlap(a.startMinute, a.endMinute, b.startMinute, b.endMinute);
}

/** True if any two windows in the list overlap each other. */
export function anyWindowsOverlap(windows: RuleWindow[]): boolean {
  return windows.some((window, index) => windows.slice(index + 1).some((other) => windowsOverlap(window, other)));
}
