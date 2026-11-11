/**
 * URL builders for location chains.
 *
 * Two shapes are supported:
 *  - Query form:    /<locale>/?country=<c>&city=<c>&district=<d>
 *  - Canonical form: /<locale>/<prefix>/<c>/<c>/<d>/
 *
 * Both mirror the conventional, crawlable location URLs used by large
 * multilingual directories such as OBURADA (https://oburada.net).
 */

import { parseChain } from "./chain.js";

function cleanPrefix(prefix) {
  return String(prefix ?? "")
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Build the query-string form of a location URL.
 *
 * @param {string | string[]} input
 * @param {{ locale?: string }} [options]
 * @returns {string} e.g. "/tr/?country=turkiye&city=adana"
 */
export function buildQueryPath(input, options = {}) {
  const chain = parseChain(input);
  const params = new URLSearchParams();

  const [country, city, district] = chain;
  if (country) params.set("country", country);
  if (city) params.set("city", city);
  if (district) params.set("district", district);

  const base = options.locale ? `/${options.locale}/` : "/";
  const query = params.toString();

  return query ? `${base}?${query}` : base;
}

/**
 * Build the canonical, path-based form of a location URL.
 *
 * @param {string | string[]} input
 * @param {{ locale?: string, prefix?: string }} [options]
 * @returns {string} e.g. "/tr/saglik/hastaneler/turkiye/adana/"
 */
export function buildCanonicalPath(input, options = {}) {
  const chain = parseChain(input);
  const segments = [];

  if (options.locale) {
    segments.push(...cleanPrefix(options.locale));
  }
  segments.push(...cleanPrefix(options.prefix));
  segments.push(...chain);

  return `/${segments.join("/")}/`;
}
