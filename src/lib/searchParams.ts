/** Shape of Next.js `searchParams` once awaited. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * One query-string value, or null when absent/empty. Repeated keys never come
 * from our own forms and links, so they are rejected as malformed.
 */
export function readSearchParam(params: RawSearchParams, key: string): string | null {
  const value = params[key];
  if (value === undefined || value === "") return null;
  if (Array.isArray(value)) throw new Error(`Query parameter "${key}" must appear once`);
  return value;
}
