/**
 * Location slug chain parsing and validation.
 *
 * A chain is an ordered list of slugs following the location hierarchy:
 * country -> city -> district (1 to 3 segments).
 */

import { LOCATION_LEVELS, MAX_CHAIN_LENGTH, validateSlug } from "./validate.js";

/**
 * Normalize different inputs into an array of slug segments.
 *
 * Accepts an array of segments or a single string such as
 * "turkiye/adana/seyhan" (also accepts commas). Empty segments are dropped.
 *
 * @param {string | string[] | null | undefined} input
 * @returns {string[]}
 */
export function parseChain(input) {
  if (Array.isArray(input)) {
    return input.map((part) => String(part).trim()).filter((part) => part.length > 0);
  }

  if (typeof input === "string") {
    return input
      .split(/[/,]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  if (input === null || input === undefined) {
    return [];
  }

  return [String(input).trim()].filter((part) => part.length > 0);
}

/**
 * Validate a full location chain.
 *
 * @param {string | string[]} input
 * @returns {{
 *   valid: boolean,
 *   chain: string[],
 *   normalized: string,
 *   level: string | null,
 *   errors: Array<{ code: string, message: string, index?: number, slug?: string }>
 * }}
 */
export function validateChain(input) {
  const chain = parseChain(input);
  const errors = [];

  if (chain.length === 0) {
    errors.push({
      code: "empty-chain",
      message: `Provide at least one segment (${LOCATION_LEVELS.join(" -> ")}).`,
    });
  }

  if (chain.length > MAX_CHAIN_LENGTH) {
    errors.push({
      code: "too-many-levels",
      message: `A chain has at most ${MAX_CHAIN_LENGTH} levels (${LOCATION_LEVELS.join(" -> ")}).`,
    });
  }

  chain.forEach((slug, index) => {
    const result = validateSlug(slug);
    for (const error of result.errors) {
      errors.push({
        code: error.code,
        message: `Segment ${index + 1} ("${slug}"): ${error.message}`,
        index,
        slug,
      });
    }
  });

  const seen = new Set();
  chain.forEach((slug, index) => {
    if (seen.has(slug)) {
      errors.push({
        code: "duplicate-slug",
        message: `Segment ${index + 1} repeats the slug "${slug}".`,
        index,
        slug,
      });
    } else {
      seen.add(slug);
    }
  });

  const level =
    chain.length > 0 && chain.length <= MAX_CHAIN_LENGTH
      ? LOCATION_LEVELS[chain.length - 1]
      : null;

  return {
    valid: errors.length === 0,
    chain,
    normalized: chain.join("/"),
    level,
    errors,
  };
}

/**
 * Map each segment to its level name.
 *
 * @param {string | string[]} input
 * @returns {Record<string, string>} e.g. { country: "turkiye", city: "adana" }
 */
export function describeChain(input) {
  const chain = parseChain(input);
  const described = {};

  chain.forEach((slug, index) => {
    const level = LOCATION_LEVELS[index];
    if (level) {
      described[level] = slug;
    }
  });

  return described;
}
