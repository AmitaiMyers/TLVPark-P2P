import { describe, expect, it } from "vitest";
import { summarizeWeeklySchedule } from "./scheduleSummary";
import { durationBetween, upcomingJerusalemDates, windowFromParts } from "./whenPicker";

describe("upcomingJerusalemDates", () => {
  it("starts from the Jerusalem date, not the UTC date", () => {
    // 22:30 UTC on Nov 5 is already Nov 6 in Israel.
    expect(upcomingJerusalemDates(new Date("2026-11-05T22:30:00Z"), 3)).toEqual([
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ]);
  });

  it("does not skip the DST change day", () => {
    expect(upcomingJerusalemDates(new Date("2026-03-26T10:00:00Z"), 3)).toEqual([
      "2026-03-26",
      "2026-03-27",
      "2026-03-28",
    ]);
  });
});

describe("windowFromParts / durationBetween", () => {
  it("adds the duration, crossing midnight", () => {
    expect(windowFromParts("2026-11-08", "22:00", 180)).toEqual({ start: "2026-11-08T22:00", end: "2026-11-09T01:00" });
  });

  it("returns null for a start inside the DST gap", () => {
    expect(windowFromParts("2026-03-27", "02:30", 60)).toBeNull();
  });

  it("measures elapsed minutes", () => {
    expect(durationBetween("2026-11-08T10:00", "2026-11-08T12:30")).toBe(150);
  });
});

describe("summarizeWeeklySchedule", () => {
  it("merges consecutive identical days", () => {
    const rules = [0, 1, 2, 3, 4].map((dayOfWeek) => ({ dayOfWeek, startMinute: 480, endMinute: 1080 }));
    expect(summarizeWeeklySchedule(rules)).toEqual([
      { firstDay: 0, lastDay: 4, windows: [{ startMinute: 480, endMinute: 1080 }] },
    ]);
  });

  it("keeps different or non-consecutive days apart", () => {
    const rules = [
      { dayOfWeek: 0, startMinute: 480, endMinute: 1080 },
      { dayOfWeek: 2, startMinute: 480, endMinute: 1080 },
      { dayOfWeek: 5, startMinute: 0, endMinute: 1440 },
      { dayOfWeek: 6, startMinute: 0, endMinute: 1440 },
    ];
    expect(summarizeWeeklySchedule(rules).map((group) => [group.firstDay, group.lastDay])).toEqual([
      [0, 0],
      [2, 2],
      [5, 6],
    ]);
  });
});
