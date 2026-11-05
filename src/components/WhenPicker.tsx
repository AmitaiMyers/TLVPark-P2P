"use client";

import { Calendar, Clock, Hourglass } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatDayOption, formatDuration } from "@/lib/format";
import { floorToSlot, formatMinuteOfDay, MINUTE_OF_DAY_OPTIONS, MINUTES_PER_DAY, toJerusalemInputValue } from "@/lib/time";
import {
  DATE_OPTION_COUNT,
  DURATION_OPTIONS_MINUTES,
  durationBetween,
  splitInputValue,
  upcomingJerusalemDates,
  windowFromParts,
} from "@/lib/whenPicker";
import { styles } from "./ui";

const START_TIMES = MINUTE_OF_DAY_OPTIONS.filter((minute) => minute < MINUTES_PER_DAY).map(formatMinuteOfDay);

type WhenPickerProps = {
  locale: Locale;
  text: Dictionary["when"];
  /** datetime-local values (Jerusalem time) to start from. */
  defaultStart: string;
  defaultEnd: string;
  /** Request time from the server, so server and client render the same options. */
  nowMs: number;
  onChange?: (window: { start: string; end: string } | null) => void;
};

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <label className={styles.label}>
      <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * "Day · From · For" picker: three native selects that are easy to use on a
 * phone, instead of datetime-local inputs that get cut off on small screens.
 * Submits hidden `start` and `end` values for the surrounding form.
 */
export function WhenPicker({ locale, text, defaultStart, defaultEnd, nowMs, onChange }: WhenPickerProps) {
  const now = new Date(nowMs);
  const dates = upcomingJerusalemDates(now, DATE_OPTION_COUNT);
  const earliestToday = splitInputValue(toJerusalemInputValue(floorToSlot(now))).time;

  const initial = splitInputValue(defaultStart);
  const initialDuration = durationBetween(defaultStart, defaultEnd);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [durationMinutes, setDurationMinutes] = useState(initialDuration ?? DURATION_OPTIONS_MINUTES[2]);

  // Keep a duration that came from a link even if it is not a preset.
  const durationOptions = DURATION_OPTIONS_MINUTES.includes(durationMinutes)
    ? DURATION_OPTIONS_MINUTES
    : [...DURATION_OPTIONS_MINUTES, durationMinutes].sort((a, b) => a - b);
  // A date from a link may lie beyond the 14 offered days: keep it selectable.
  const dateOptions = dates.includes(date) ? dates : [...dates, date];

  const window = windowFromParts(date, time, durationMinutes);

  function update(next: { date?: string; time?: string; durationMinutes?: number }) {
    const nextDate = next.date ?? date;
    const nextTime = next.time ?? time;
    const nextDuration = next.durationMinutes ?? durationMinutes;
    setDate(nextDate);
    setTime(nextTime);
    setDurationMinutes(nextDuration);
    onChange?.(windowFromParts(nextDate, nextTime, nextDuration));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1.3fr_1fr_1.1fr] gap-2">
        <Field icon={<Calendar size={14} aria-hidden />} label={text.date}>
          <select value={date} onChange={(event) => update({ date: event.target.value })} className={styles.input}>
            {dateOptions.map((option, index) => (
              <option key={option} value={option}>
                {formatDayOption(option, index, locale, text)}
              </option>
            ))}
          </select>
        </Field>
        <Field icon={<Clock size={14} aria-hidden />} label={text.startTime}>
          <select value={time} onChange={(event) => update({ time: event.target.value })} className={styles.input} dir="ltr">
            {START_TIMES.map((option) => (
              <option key={option} value={option} disabled={date === dates[0] && option < earliestToday}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field icon={<Hourglass size={14} aria-hidden />} label={text.duration}>
          <select
            value={durationMinutes}
            onChange={(event) => update({ durationMinutes: Number(event.target.value) })}
            className={styles.input}
          >
            {durationOptions.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes, text)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {window === null && <p className={styles.error}>{text.invalidStart}</p>}
      {/* For a non-existent (DST-gap) start, the raw value is submitted so the
          server answers with its INVALID_LOCAL_TIME message. */}
      <input type="hidden" name="start" value={window === null ? `${date}T${time}` : window.start} />
      <input type="hidden" name="end" value={window === null ? `${date}T${time}` : window.end} />
    </div>
  );
}
