/**
 * Fills {placeholders} in a dictionary string.
 * Throws when the template references a value that was not provided, so a
 * typo never renders a raw "{name}" to users.
 */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`Missing template value "${key}" for "${template}"`);
    return String(values[key]);
  });
}
