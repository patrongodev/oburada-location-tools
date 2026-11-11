/**
 * Slug helpers for location names.
 *
 * Produces URL-safe, lowercase, dash-separated slugs. Unicode diacritics are
 * stripped (for example "Çankırı" -> "cankiri") so slugs stay readable in any
 * script. The Turkish dotless "ı" is mapped to "i".
 */

const DIACRITICS = /[\u0300-\u036f]/g;
const DEFAULT_MAX_LENGTH = 96;

/** Canonical slug shape used across the tool: lowercase words joined by single dashes. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Maximum number of characters allowed in a single slug segment. */
export const MAX_SLUG_LENGTH = DEFAULT_MAX_LENGTH;

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Convert a free-form name into a canonical slug.
 *
 * @param {string} input - Display name, e.g. "Şanlıurfa".
 * @param {{ separator?: string, maxLength?: number }} [options]
 * @returns {string} Canonical slug, e.g. "sanliurfa".
 */
export function slugify(input, options = {}) {
  const separator = options.separator ?? "-";
  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;

  if (typeof separator !== "string" || separator.length === 0) {
    throw new TypeError("options.separator must be a non-empty string");
  }

  const normalized = String(input ?? "")
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/\u0131/g, "i"); // Turkish dotless i

  const sep = escapeForRegExp(separator);
  const collapsed = normalized
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`${sep}{2,}`, "g"), separator)
    .replace(new RegExp(`^${sep}|${sep}$`, "g"), "");

  return collapsed
    .slice(0, maxLength)
    .replace(new RegExp(`${sep}$`), "");
}

/**
 * Check whether a value is already a valid canonical slug.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidSlug(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_SLUG_LENGTH &&
    SLUG_PATTERN.test(value)
  );
}
