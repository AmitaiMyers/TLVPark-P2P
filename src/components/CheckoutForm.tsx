"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fillTemplate } from "@/i18n/template";
import type { ActionResult } from "@/lib/actionResult";
import { parseBookingWindow } from "@/lib/bookingWindow";
import { formatIls } from "@/lib/format";
import { computeBookingPriceAgorot, type SpotPricing } from "@/lib/pricing";
import { ActionForm, SubmitButton } from "./ActionForm";
import { WhenPicker } from "./WhenPicker";
import { styles } from "./ui";

type CheckoutFormProps = {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  locale: Locale;
  pricing: SpotPricing;
  defaultStart: string;
  defaultEnd: string;
  nowMs: number;
  dictionary: Pick<Dictionary, "checkout" | "errors" | "when">;
};

/**
 * Time selection with a live price, then a simulated payment. The preview
 * runs the same validation and pricing code as the server.
 */
export function CheckoutForm({ action, locale, pricing, defaultStart, defaultEnd, nowMs, dictionary }: CheckoutFormProps) {
  const [range, setRange] = useState<{ start: string; end: string } | null>({ start: defaultStart, end: defaultEnd });

  const preview = range === null ? null : parseBookingWindow(range.start, range.end, new Date(nowMs));
  const priceAgorot =
    preview !== null && preview.ok
      ? computeBookingPriceAgorot(preview.window.startsAt, preview.window.endsAt, pricing)
      : null;
  const priceLabel = priceAgorot === null ? "—" : formatIls(priceAgorot, locale);

  return (
    <ActionForm action={action} errorMessages={dictionary.errors}>
      <WhenPicker
        locale={locale}
        text={dictionary.when}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        nowMs={nowMs}
        onChange={setRange}
      />
      {preview !== null && !preview.ok && <p className={styles.error}>{dictionary.errors[preview.error]}</p>}

      <div className="flex items-center justify-between rounded-xl bg-brand/10 px-4 py-3">
        <span className="font-medium">{dictionary.checkout.priceFor}</span>
        <strong className="text-2xl text-accent">{priceLabel}</strong>
      </div>

      <SubmitButton>
        <CreditCard size={18} aria-hidden />
        {fillTemplate(dictionary.checkout.pay, { amount: priceLabel })}
      </SubmitButton>
      <p className={`${styles.muted} text-center`}>{dictionary.checkout.simulatedNote}</p>
    </ActionForm>
  );
}
