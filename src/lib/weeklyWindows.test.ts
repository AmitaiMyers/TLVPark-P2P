import { describe, expect, it } from "vitest";
import { anyWindowsOverlap, windowsForDays } from "./weeklyWindows";

describe("windowsForDays", () => {
  it("creates one window per day for a same-day range", () => {
    expect(windowsForDays([0, 1], 480, 1080)).toEqual([
      { dayOfWeek: 0, startMinute: 480, endMinute: 1080 },
      { dayOfWeek: 1, startMinute: 480, endMinute: 1080 },
    ]);
  });

  it("splits an overnight range into evening + next morning, wrapping Saturday to Sunday", () => {
    expect(windowsForDays([6], 1320, 360)).toEqual([
      { dayOfWeek: 6, startMinute: 1320, endMinute: 1440 },
      { dayOfWeek: 0, startMinute: 0, endMinute: 360 },
    ]);
  });

  it("treats an end of 00:00 as end of day", () => {
    expect(windowsForDays([2], 1200, 0)).toEqual([{ dayOfWeek: 2, startMinute: 1200, endMinute: 1440 }]);
  });

  it("throws on a zero-length window", () => {
    expect(() => windowsForDays([2], 600, 600)).toThrow();
  });
});

describe("anyWindowsOverlap", () => {
  it("detects consecutive overnight days colliding (Sun 20:00-10:00 overlaps Mon 20:00 only if mornings run late)", () => {
    expect(anyWindowsOverlap(windowsForDays([0, 1], 1200, 360))).toBe(false);
    expect(anyWindowsOverlap([...windowsForDays([0], 1200, 600), ...windowsForDays([1], 480, 900)])).toBe(true);
  });
});
