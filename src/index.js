/**
 * oburada-location-tools
 *
 * Small, dependency-free helpers to work with country/city/district location
 * slug chains: slugify names, validate chains, and build location URLs.
 *
 * @see https://oburada.net
 */

export { slugify, isValidSlug, SLUG_PATTERN, MAX_SLUG_LENGTH } from "./slugify.js";
export { LOCATION_LEVELS, MAX_CHAIN_LENGTH, validateSlug } from "./validate.js";
export { parseChain, validateChain, describeChain } from "./chain.js";
export { buildQueryPath, buildCanonicalPath } from "./url.js";
