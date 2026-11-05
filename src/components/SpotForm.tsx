"use client";

import type { ReactNode } from "react";
import type { SpotType } from "@/generated/prisma/enums";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { ActionResult } from "@/lib/actionResult";
import { SPOT_TYPES } from "@/lib/enums";
import { VEHICLE_SPACE_REQUIREMENTS } from "@/lib/vehicle";
import { ActionForm, SubmitButton } from "./ActionForm";
import { FEATURE_KEYS } from "./SpotFeatureBadges";
import { LocationPicker } from "./map/LocationPicker";
import { styles } from "./ui";

const SMALLEST_VEHICLE = VEHICLE_SPACE_REQUIREMENTS.MOTORCYCLE;

/** Editable spot fields, in form units (shekels, not agorot). */
export type SpotFormValues = {
  title: string;
  description: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  spotType: SpotType;
  lengthCm: number;
  widthCm: number;
  heightClearanceCm: number | null;
  isCovered: boolean;
  isGated: boolean;
  hasEvCharger: boolean;
  hourlyRateShekels: number;
  dailyCapShekels: number;
  gatePhoneNumber: string | null;
  accessInstructions: string;
};

type SpotFormProps = {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  locale: Locale;
  /** null = new spot (empty form). */
  initial: SpotFormValues | null;
  submitLabel: string;
  successMessage?: string;
  dictionary: Pick<Dictionary, "spotForm" | "enums" | "errors">;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={`${styles.card} flex flex-col gap-3`}>
      <legend className={`${styles.sectionTitle} px-1`}>{title}</legend>
      {children}
    </fieldset>
  );
}

/** Shared by "list a new spot" and "manage spot", so both validate the same way. */
export function SpotForm({ action, locale, initial, submitLabel, successMessage, dictionary }: SpotFormProps) {
  const text = dictionary.spotForm;
  const enums = dictionary.enums;

  return (
    <ActionForm action={action} errorMessages={dictionary.errors} successMessage={successMessage} className="flex flex-col gap-4">
      <Section title={text.sectionDetails}>
        <label className={styles.label}>
          {text.title}
          <input name="title" required maxLength={100} defaultValue={initial?.title} placeholder={text.titlePlaceholder} className={styles.input} />
        </label>
        <label className={styles.label}>
          {text.description}
          <textarea name="description" required rows={3} maxLength={1000} defaultValue={initial?.description} className={styles.input} />
        </label>
        <label className={styles.label}>
          {text.spotType}
          <select name="spotType" required defaultValue={initial?.spotType ?? "DRIVEWAY"} className={styles.input}>
            {SPOT_TYPES.map((spotType) => (
              <option key={spotType} value={spotType}>
                {enums.spotType[spotType]}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <Section title={text.sectionLocation}>
        <LocationPicker
          locale={locale}
          text={text}
          defaultAddress={initial?.addressLine ?? ""}
          defaultLocation={initial === null ? null : { latitude: initial.latitude, longitude: initial.longitude }}
        />
      </Section>

      <Section title={text.sectionSize}>
        <div className="grid grid-cols-3 gap-3">
          <label className={styles.label}>
            {text.length}
            <input name="lengthCm" type="number" required min={SMALLEST_VEHICLE.minLengthCm} max={5000} defaultValue={initial?.lengthCm} className={styles.input} />
          </label>
          <label className={styles.label}>
            {text.width}
            <input name="widthCm" type="number" required min={SMALLEST_VEHICLE.minWidthCm} max={5000} defaultValue={initial?.widthCm} className={styles.input} />
          </label>
          <label className={styles.label}>
            {text.height}
            <input
              name="heightClearanceCm"
              type="number"
              min={SMALLEST_VEHICLE.minHeightCm}
              max={1000}
              defaultValue={initial?.heightClearanceCm ?? undefined}
              className={styles.input}
            />
          </label>
        </div>
        <p className={styles.muted}>{text.heightHint}</p>
      </Section>

      <Section title={text.sectionFeatures}>
        <div className="flex flex-wrap gap-4">
          {FEATURE_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input type="checkbox" name={key} defaultChecked={initial?.[key]} />
              {enums.feature[key]}
            </label>
          ))}
        </div>
      </Section>

      <Section title={text.sectionPricing}>
        <div className="grid grid-cols-2 gap-3">
          <label className={styles.label}>
            {text.hourlyRate}
            <input name="hourlyRateShekels" type="number" required min={1} max={1000} step={1} defaultValue={initial?.hourlyRateShekels} className={styles.input} />
          </label>
          <label className={styles.label}>
            {text.dailyCap}
            <input name="dailyCapShekels" type="number" required min={1} max={10000} step={1} defaultValue={initial?.dailyCapShekels} className={styles.input} />
          </label>
        </div>
      </Section>

      <Section title={text.sectionAccess}>
        <label className={styles.label}>
          {text.gatePhone}
          <input
            name="gatePhoneNumber"
            type="tel"
            dir="ltr"
            defaultValue={initial?.gatePhoneNumber ?? undefined}
            placeholder="+972-3-555-1234"
            className={styles.input}
          />
          <span className={styles.muted}>{text.gatePhoneHint}</span>
        </label>
        <label className={styles.label}>
          {text.accessInstructions}
          <textarea
            name="accessInstructions"
            required
            rows={3}
            maxLength={1000}
            defaultValue={initial?.accessInstructions}
            placeholder={text.accessPlaceholder}
            className={styles.input}
          />
        </label>
      </Section>

      <SubmitButton>{submitLabel}</SubmitButton>
    </ActionForm>
  );
}
