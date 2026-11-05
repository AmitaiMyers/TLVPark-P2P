import { describe, expect, it } from "vitest";
import {
  floorToSlot,
  formatMinuteOfDay,
  jerusalemWeekdayAndMinute,
  parseJerusalemInputValue,
  toJerusalemInputValue,
} from "./time";

describe("parseJerusalemInputValue", () => {
  it("converts winter time (UTC+2)", () => {
    expect(parseJerusalemInputValue("2026-11-10T10:00")?.toISOString()).toBe("2026-11-10T08:00:00.000Z");
  });

  it("converts summer time (UTC+3)", () => {
    expect(parseJerusalemInputValue("2026-07-01T10:00")?.toISOString()).toBe("2026-07-01T07:00:00.000Z");
  });

  it("returns null for the hour skipped when clocks jump forward (2026-03-27 02:00 -> 03:00)", () => {
    expect(parseJerusalemInputValue("2026-03-27T02:30")).toBeNull();
    expect(parseJerusalemInputValue("2026-03-27T03:00")?.toISOString()).toBe("2026-03-27T00:00:00.000Z");
  });

  it("resolves the repeated hour when clocks fall back (2026-10-25) to a valid instant", () => {
    const instant = parseJerusalemInputValue("2026-10-25T01:30");
    expect(instant).not.toBeNull();
    expect(toJerusalemInputValue(instant as Date)).toBe("2026-10-25T01:30");
  });

  it("throws on malformed input", () => {
    expect(() => parseJerusalemInputValue("2026-11-10 10:00")).toThrow(/Invalid local date-time/);
  });
});

describe("toJerusalemInputValue", () => {
  it("round-trips with parseJerusalemInputValue", () => {
    expect(toJerusalemInputValue(new Date("2026-11-10T08:00:00Z"))).toBe("2026-11-10T10:00");
  });
});

describe("jerusalemWeekdayAndMinute", () => {
  it("uses local time, not UTC: 23:30Z Saturday is 01:30 Sunday in Israel", () => {
    expect(jerusalemWeekdayAndMinute(new Date("2026-11-07T23:30:00Z"))).toEqual({ dayOfWeek: 0, minuteOfDay: 90 });
  });
});

describe("floorToSlot / formatMinuteOfDay", () => {
  it("floors to the half hour", () => {
    expect(floorToSlot(new Date("2026-11-10T08:44:59Z")).toISOString()).toBe("2026-11-10T08:30:00.000Z");
  });

  it("formats minutes, including end of day", () => {
    expect(formatMinuteOfDay(510)).toBe("08:30");
    expect(formatMinuteOfDay(1440)).toBe("24:00");
  });
});
