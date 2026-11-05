import { describe, expect, it } from "vitest";
import { isWindowAvailable, type AvailabilityOverride, type WeeklyRule } from "./availability";
import { parseJerusalemInputValue } from "./time";

const local = (value: string) => parseJerusalemInputValue(value) as Date;

// 2026-11-10 is a Tuesday (dayOfWeek 2). Commuter spot: Sun-Thu 08:00-18:00.
const commuterRules: WeeklyRule[] = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
  dayOfWeek,
  startMinute: 8 * 60,
  endMinute: 18 * 60,
}));

describe("isWindowAvailable", () => {
  it("accepts a window fully inside a weekly rule", () => {
    expect(isWindowAvailable(commuterRules, [], local("2026-11-10T09:00"), local("2026-11-10T17:00"))).toBe(true);
  });

  it("accepts a window ending exactly at the rule's end", () => {
    expect(isWindowAvailable(commuterRules, [], local("2026-11-10T16:00"), local("2026-11-10T18:00"))).toBe(true);
  });

  it("rejects a window running past the rule's end", () => {
    expect(isWindowAvailable(commuterRules, [], local("2026-11-10T17:00"), local("2026-11-10T18:30"))).toBe(false);
  });

  it("rejects a day without rules (Friday)", () => {
    expect(isWindowAvailable(commuterRules, [], local("2026-11-13T09:00"), local("2026-11-13T11:00"))).toBe(false);
  });

  it("lets a BLOCKED exception override the weekly rule", () => {
    const blocked: AvailabilityOverride[] = [
      { kind: "BLOCKED", startsAt: local("2026-11-10T12:00"), endsAt: local("2026-11-10T13:00") },
    ];
    expect(isWindowAvailable(commuterRules, blocked, local("2026-11-10T11:00"), local("2026-11-10T14:00"))).toBe(false);
    expect(isWindowAvailable(commuterRules, blocked, local("2026-11-10T13:00"), local("2026-11-10T14:00"))).toBe(true);
  });

  it("lets an EXTRA exception open time outside the weekly rules", () => {
    const extra: AvailabilityOverride[] = [
      { kind: "EXTRA", startsAt: local("2026-11-13T09:00"), endsAt: local("2026-11-13T15:00") },
    ];
    expect(isWindowAvailable(commuterRules, extra, local("2026-11-13T10:00"), local("2026-11-13T12:00"))).toBe(true);
  });

  it("supports a window spanning two days covered by an overnight rule pair", () => {
    const overnight: WeeklyRule[] = [
      { dayOfWeek: 2, startMinute: 20 * 60, endMinute: 24 * 60 },
      { dayOfWeek: 3, startMinute: 0, endMinute: 7 * 60 },
    ];
    expect(isWindowAvailable(overnight, [], local("2026-11-10T22:00"), local("2026-11-11T06:00"))).toBe(true);
  });
});
