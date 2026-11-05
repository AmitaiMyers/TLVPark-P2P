"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fillTemplate } from "@/i18n/template";
import type { ActionResult } from "@/lib/actionResult";
import { parseBookingWindow } from "@/lib/bookingWindow";
import { formatIls } from "@/lib/format";
import { computeBookingPriceAgorot, type SpotPricing } from "@/lib/pricing";
import { ActionForm, SubmitButton } from "./ActionForm";
import { TimeRangeInputs } from "./TimeRangeInputs";
import { styles } from "./ui";

type CheckoutFormProps = {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  locale: Locale;
  pricing: SpotPricing;
  defaultStart: string;
  defaultEnd: string;
  minStart: string;
  dictionary: Pick<Dictionary, "checkout" | "common" | "errors">;
};

/**
 * Time selection with a live price preview, then a simulated payment.
 * The preview runs the same validation and pricing code as the server.
 */
export function CheckoutForm({ action, locale, pricing, defaultStart, defaultEnd, minStart, dictionary }: CheckoutFormProps) {
  const [range, setRange] = useState({ start: defaultStart, end: defaultEnd });

  const hasBothValues = range.start !== "" && range.end !== "";
  const preview = hasBothValues ? parseBookingWindow(range.start, range.end, new Date()) : null;
  const priceAgorot =
    preview !== null && preview.ok
      ? computeBookingPriceAgorot(preview.window.startsAt, preview.window.endsAt, pricing)
      : null;

  return (
    <ActionForm action={action} errorMessages={dictionary.errors}>
      <TimeRangeInputs
        startLabel={dictionary.common.from}
        endLabel={dictionary.common.until}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        min={minStart}
        required
        onChange={(field, value) => setRange((current) => ({ ...current, [field]: value }))}
      />

      <div className="flex items-center justify-between rounded-xl bg-brand/10 p-3">
        <span>{dictionary.checkout.priceFor}</span>
        <strong className="text-lg">{priceAgorot === null ? "—" : formatIls(priceAgorot, locale)}</strong>
      </div>
      {preview === null && <p className={styles.muted}>{dictionary.checkout.choosePrompt}</p>}
      {preview !== null && !preview.ok && <p className={styles.error}>{dictionary.errors[preview.error]}</p>}

      <SubmitButton>
        {priceAgorot === null
          ? fillTemplate(dictionary.checkout.pay, { amount: "—" })
          : fillTemplate(dictionary.checkout.pay, { amount: formatIls(priceAgorot, locale) })}
      </SubmitButton>
      <p className={styles.muted}>{dictionary.checkout.simulatedNote}</p>
    </ActionForm>
  );
}
