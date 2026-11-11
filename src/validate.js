/**
 * Single-segment validation rules.
 */

import { MAX_SLUG_LENGTH, SLUG_PATTERN } from "./slugify.js";

/** Ordered location levels, from the top of the hierarchy down. */
export const LOCATION_LEVELS = Object.freeze(["country", "city", "district"]);

/** A location chain has at most as many segments as there are levels. */
export const MAX_CHAIN_LENGTH = LOCATION_LEVELS.length;

/**
 * Validate a single slug segment.
 *
 * @param {unknown} value
 * @returns {{ valid: boolean, errors: Array<{ code: string, message: string }> }}
 */
export function validateSlug(value) {
  const errors = [];

  if (typeof value !== "string") {
    errors.push({ code: "not-a-string", message: "Slug must be a string." });
    return { valid: false, errors };
  }

  if (value.length === 0) {
    errors.push({ code: "empty-slug", message: "Slug must not be empty." });
    return { valid: false, errors };
  }

  if (value.length > MAX_SLUG_LENGTH) {
    errors.push({
      code: "too-long",
      message: `Slug must be at most ${MAX_SLUG_LENGTH} characters (got ${value.length}).`,
    });
  } else if (!SLUG_PATTERN.test(value)) {
    errors.push({
      code: "invalid-format",
      message:
        "Slug may only contain lowercase letters (a-z), digits (0-9) and single dashes between words.",
    });
  }

  return { valid: errors.length === 0, errors };
}
