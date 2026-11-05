import { describe, expect, it } from "vitest";
import { deriveSpotSize, spotFitsVehicle } from "./vehicle";
import { parseBookingWindow } from "./bookingWindow";

describe("deriveSpotSize", () => {
  it("picks the largest category that fits", () => {
    expect(deriveSpotSize({ lengthCm: 500, widthCm: 230, heightClearanceCm: null })).toBe("REGULAR");
    expect(deriveSpotSize({ lengthCm: 600, widthCm: 260, heightClearanceCm: null })).toBe("SUV_VAN");
  });

  it("lets a low ceiling downgrade a long spot", () => {
    expect(deriveSpotSize({ lengthCm: 600, widthCm: 260, heightClearanceCm: 190 })).toBe("REGULAR");
  });

  it("throws when nothing fits", () => {
    expect(() => deriveSpotSize({ lengthCm: 100, widthCm: 80, heightClearanceCm: null })).toThrow();
  });

  it("checks a single category", () => {
    expect(spotFitsVehicle({ lengthCm: 450, widthCm: 200, heightClearanceCm: 180 }, "SMALL")).toBe(true);
    expect(spotFitsVehicle({ lengthCm: 450, widthCm: 200, heightClearanceCm: 180 }, "REGULAR")).toBe(false);
  });
});

describe("parseBookingWindow", () => {
  const now = new Date("2026-11-10T08:10:00Z"); // 10:10 Israel time

  it("accepts a valid window, including the slot already in progress", () => {
    const result = parseBookingWindow("2026-11-10T10:00", "2026-11-10T12:00", now);
    expect(result).toEqual({
      ok: true,
      window: { startsAt: new Date("2026-11-10T08:00:00Z"), endsAt: new Date("2026-11-10T10:00:00Z") },
    });
  });

  it.each([
    ["2026-11-10T12:00", "2026-11-10T11:00", "END_NOT_AFTER_START"],
    ["2026-11-10T11:00", "2026-11-10T11:30", "TOO_SHORT"],
    ["2026-11-10T11:15", "2026-11-10T12:15", "NOT_ON_SLOT"],
    ["2026-11-10T09:00", "2026-11-10T11:00", "IN_THE_PAST"],
    ["2026-11-10T11:00", "2026-12-20T11:00", "TOO_LONG"],
    ["2027-03-26T02:30", "2027-03-26T05:00", "INVALID_LOCAL_TIME"],
  ])("rejects %s -> %s with %s", (start, end, error) => {
    expect(parseBookingWindow(start, end, now)).toEqual({ ok: false, error });
  });
});
