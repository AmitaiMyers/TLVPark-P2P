/**
 * FormData readers for server actions.
 *
 * Browser-side validation (required, min, max, step) handles honest users, so
 * a missing or malformed field here means a tampered or buggy request: these
 * readers throw instead of returning defaults. `FormData` only exposes `.get()`,
 * and every result is checked explicitly.
 */

function readRaw(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`Form field "${name}" must be text, got a file`);
  return value.trim();
}

export function readRequiredString(formData: FormData, name: string): string {
  const value = readRaw(formData, name);
  if (value === null || value === "") throw new Error(`Form field "${name}" is required`);
  return value;
}

/** Empty or absent -> null. */
export function readOptionalString(formData: FormData, name: string): string | null {
  const value = readRaw(formData, name);
  return value === null || value === "" ? null : value;
}

type NumberBounds = { min: number; max: number };

function assertInBounds(name: string, value: number, bounds: NumberBounds): number {
  if (value < bounds.min || value > bounds.max) {
    throw new Error(`Form field "${name}" must be between ${bounds.min} and ${bounds.max}, got ${value}`);
  }
  return value;
}

export function readInteger(formData: FormData, name: string, bounds: NumberBounds): number {
  const value = Number(readRequiredString(formData, name));
  if (!Number.isInteger(value)) throw new Error(`Form field "${name}" must be an integer`);
  return assertInBounds(name, value, bounds);
}

export function readOptionalInteger(formData: FormData, name: string, bounds: NumberBounds): number | null {
  const raw = readOptionalString(formData, name);
  return raw === null ? null : readInteger(formData, name, bounds);
}

export function readFloat(formData: FormData, name: string, bounds: NumberBounds): number {
  const value = Number(readRequiredString(formData, name));
  if (!Number.isFinite(value)) throw new Error(`Form field "${name}" must be a number`);
  return assertInBounds(name, value, bounds);
}

/** Checkboxes are absent from FormData when unchecked. */
export function readCheckbox(formData: FormData, name: string): boolean {
  return formData.has(name);
}

export function readEnum<T extends string>(formData: FormData, name: string, allowed: readonly T[]): T {
  const value = readRequiredString(formData, name);
  const match = allowed.find((option) => option === value);
  if (match === undefined) throw new Error(`Form field "${name}" must be one of ${allowed.join(", ")}`);
  return match;
}

/** Multi-value field (e.g. several checked "days" checkboxes); may be empty. */
export function readIntegerList(formData: FormData, name: string, bounds: NumberBounds): number[] {
  return formData.getAll(name).map((value) => {
    if (typeof value !== "string") throw new Error(`Form field "${name}" must be text, got a file`);
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw new Error(`Form field "${name}" must contain integers`);
    return assertInBounds(name, parsed, bounds);
  });
}
