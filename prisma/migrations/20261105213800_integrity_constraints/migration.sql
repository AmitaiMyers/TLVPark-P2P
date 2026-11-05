-- Hand-written invariants that the Prisma schema language cannot express.
-- Prisma does not manage CHECK or EXCLUDE constraints, so they live here
-- and are documented next to their fields in schema.prisma.

-- Lets EXCLUDE constraints combine plain equality ("spotId" WITH =) with
-- range overlap (&&) in a single GiST index.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- True when the instant falls on a :00 or :30 boundary with zero seconds.
-- Uses the UTC epoch, so it does not depend on the session time zone.
-- Israel's UTC offset is always a whole number of hours (+02/+03), so a UTC
-- half-hour boundary is also a local Asia/Jerusalem half-hour boundary.
-- IMMUTABLE is accurate here: epoch extraction ignores the time zone.
CREATE FUNCTION is_half_hour_aligned(instant TIMESTAMPTZ) RETURNS BOOLEAN
    LANGUAGE SQL IMMUTABLE STRICT
    AS $$ SELECT mod(extract(epoch FROM instant), 1800) = 0 $$;

-- ParkingSpot -----------------------------------------------------------------

ALTER TABLE "ParkingSpot"
    ADD CONSTRAINT "ParkingSpot_inside_tel_aviv_check"
        CHECK ("latitude" BETWEEN 32.02 AND 32.15 AND "longitude" BETWEEN 34.74 AND 34.86),
    ADD CONSTRAINT "ParkingSpot_positive_dimensions_check"
        CHECK ("lengthCm" > 0 AND "widthCm" > 0 AND ("heightClearanceCm" IS NULL OR "heightClearanceCm" > 0)),
    ADD CONSTRAINT "ParkingSpot_whole_shekel_prices_check"
        CHECK ("hourlyRateAgorot" > 0 AND "hourlyRateAgorot" % 100 = 0 AND "dailyCapAgorot" % 100 = 0),
    ADD CONSTRAINT "ParkingSpot_daily_cap_not_below_hourly_check"
        CHECK ("dailyCapAgorot" >= "hourlyRateAgorot");

-- AvailabilityRule ------------------------------------------------------------

ALTER TABLE "AvailabilityRule"
    ADD CONSTRAINT "AvailabilityRule_valid_window_check"
        CHECK (
            "dayOfWeek" BETWEEN 0 AND 6
            AND "startMinute" >= 0
            AND "endMinute" <= 1440
            AND "startMinute" < "endMinute"
            AND "startMinute" % 30 = 0
            AND "endMinute" % 30 = 0
        ),
    ADD CONSTRAINT "AvailabilityRule_no_overlap"
        EXCLUDE USING gist (
            "spotId" WITH =,
            "dayOfWeek" WITH =,
            int4range("startMinute", "endMinute", '[)') WITH &&
        );

-- AvailabilityException -------------------------------------------------------

ALTER TABLE "AvailabilityException"
    ADD CONSTRAINT "AvailabilityException_valid_window_check"
        CHECK (
            "startsAt" < "endsAt"
            AND is_half_hour_aligned("startsAt")
            AND is_half_hour_aligned("endsAt")
        ),
    ADD CONSTRAINT "AvailabilityException_no_overlap"
        EXCLUDE USING gist (
            "spotId" WITH =,
            tstzrange("startsAt", "endsAt", '[)') WITH &&
        );

-- Booking ---------------------------------------------------------------------

ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_valid_window_check"
        CHECK (
            "endsAt" - "startsAt" >= INTERVAL '1 hour'
            AND is_half_hour_aligned("startsAt")
            AND is_half_hour_aligned("endsAt")
        ),
    ADD CONSTRAINT "Booking_non_negative_price_check"
        CHECK ("totalPriceAgorot" >= 0),
    ADD CONSTRAINT "Booking_cancellation_consistent_check"
        CHECK (
            ("status" = 'CONFIRMED' AND "cancelledAt" IS NULL AND "cancelledBy" IS NULL)
            OR ("status" = 'CANCELLED' AND "cancelledAt" IS NOT NULL AND "cancelledBy" IS NOT NULL)
        ),
    -- '[)' = end-exclusive, so back-to-back bookings (10:00-12:00, 12:00-14:00)
    -- are allowed. Cancelled bookings free their slot.
    ADD CONSTRAINT "Booking_no_double_booking"
        EXCLUDE USING gist (
            "spotId" WITH =,
            tstzrange("startsAt", "endsAt", '[)') WITH &&
        ) WHERE ("status" = 'CONFIRMED');

-- Review ----------------------------------------------------------------------

ALTER TABLE "Review"
    ADD CONSTRAINT "Review_rating_range_check"
        CHECK ("rating" BETWEEN 1 AND 5);
