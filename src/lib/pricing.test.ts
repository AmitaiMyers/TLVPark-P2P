import { describe, expect, it } from "vitest";
import { computeBookingPriceAgorot } from "./pricing";

const pricing = { hourlyRateAgorot: 1500, dailyCapAgorot: 8000 }; // ₪15/hour, ₪80/day
const start = new Date("2026-11-10T08:00:00Z");
const after = (hours: number) => new Date(start.getTime() + hours * 60 * 60 * 1000);

describe("computeBookingPriceAgorot", () => {
  it("charges per hour below the cap", () => {
    expect(computeBookingPriceAgorot(start, after(3), pricing)).toBe(4500);
  });

  it("charges half the hourly rate per 30-minute slot", () => {
    expect(computeBookingPriceAgorot(start, after(1.5), pricing)).toBe(2250);
  });

  it("caps a single day at the daily cap", () => {
    expect(computeBookingPriceAgorot(start, after(10), pricing)).toBe(8000);
    expect(computeBookingPriceAgorot(start, after(24), pricing)).toBe(8000);
  });

  it("charges full days at the cap plus the remainder", () => {
    expect(computeBookingPriceAgorot(start, after(26), pricing)).toBe(8000 + 3000);
    expect(computeBookingPriceAgorot(start, after(48 + 20), pricing)).toBe(3 * 8000);
  });

  it("rejects durations that are not whole slots", () => {
    expect(() => computeBookingPriceAgorot(start, new Date(start.getTime() + 45 * 60 * 1000), pricing)).toThrow();
    expect(() => computeBookingPriceAgorot(start, start, pricing)).toThrow();
  });
});
