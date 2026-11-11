# oburada-location-tools

[![tests](https://img.shields.io/badge/tests-node%3Atest-brightgreen)](./test)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json)
[![node](https://img.shields.io/badge/node-%3E%3D18-informational)](./package.json)

Small, dependency-free helpers to work with **country → city → district** location
slug chains: turn display names into clean slugs, validate a chain, and build the
matching location URLs.

It is the tiny toolkit extracted from the location system that powers
**[OBURADA](https://oburada.net)** — a multilingual directory of places and health
services. OBURADA serves the same location URLs in 17 languages, and a single
consistent slug chain is what keeps those URLs stable and crawlable. This package
opens up that core idea so anyone can reuse it.

- Zero runtime dependencies, pure ES modules, Node.js 18+.
- Deterministic: the same name always produces the same slug.
- Unicode aware: transliterates diacritics, including Turkish characters
  (`Şanlıurfa → sanliurfa`, `Çankırı → cankiri`, `İstanbul → istanbul`).
- Ships with a library API **and** a `oburada-loc` CLI.
- Feature complete for the three levels used by most location directories.

## Why

Location directories, city guides, local SEO pages and map front-ends all need the
same three things: a **canonical slug** per place, a **validated chain** of slugs
(`country/city/district`), and a **URL** built from that chain. Getting this wrong
leads to broken links, duplicate pages and unstable URLs across languages.
`oburada-location-tools` keeps slug generation and chain validation in one small,
tested place.

## Install

```bash
npm install oburada-location-tools
```

Or use it straight from a checkout with no install step (no dependencies to fetch):

```bash
git clone https://github.com/<your-user>/oburada-location-tools.git
cd oburada-location-tools
node --test
```

## Library usage

```js
import {
  slugify,
  isValidSlug,
  validateSlug,
  parseChain,
  validateChain,
  describeChain,
  buildQueryPath,
  buildCanonicalPath,
} from "oburada-location-tools";

// 1. Build a canonical slug from a display name.
slugify("Şanlıurfa");            // "sanliurfa"
slugify("Adana (Seyhan)");       // "adana-seyhan"
slugify("São Paulo");            // "sao-paulo"
slugify("New York", { maxLength: 4 }); // "new"  (never ends with a dash)

// 2. Validate a single segment.
isValidSlug("seyhan-2");         // true
isValidSlug("Adana");            // false (uppercase)

// 3. Validate a full chain.
validateChain("turkiye/adana/seyhan");
// {
//   valid: true,
//   chain: ["turkiye", "adana", "seyhan"],
//   normalized: "turkiye/adana/seyhan",
//   level: "district",
//   errors: []
// }

validateChain("Turkiye/adana");
// {
//   valid: false,
//   chain: ["Turkiye", "adana"],
//   normalized: "Turkiye/adana",
//   level: null,
//   errors: [
//     { code: "invalid-format", message: 'Segment 1 ("Turkiye"): ...', index: 0, slug: "Turkiye" }
//   ]
// }

// 4. Describe a chain by level.
describeChain("turkiye/adana/seyhan");
// { country: "turkiye", city: "adana", district: "seyhan" }

// 5. Build URLs.
buildQueryPath("turkiye/adana", { locale: "tr" });
// "/tr/?country=turkiye&city=adana"

buildCanonicalPath("turkiye/adana/seyhan", { locale: "tr", prefix: "saglik/hastaneler" });
// "/tr/saglik/hastaneler/turkiye/adana/seyhan/"
```

### Input shapes

`parseChain` and `validateChain` accept several input styles:

```js
parseChain("turkiye/adana/seyhan"); // ["turkiye", "adana", "seyhan"]
parseChain("turkiye, adana");       // ["turkiye", "adana"]  (commas work too)
parseChain(["turkiye", " adana "]); // ["turkiye", "adana"]  (trimmed)
parseChain("turkiye//adana/");      // ["turkiye", "adana"]  (empty parts dropped)
parseChain(null);                   // []
```

### Validation error codes

| Scope          | Code                | Meaning                                             |
| -------------- | ------------------- | --------------------------------------------------- |
| `validateSlug` | `not-a-string`      | Value is not a string                               |
| `validateSlug` | `empty-slug`        | Empty string                                        |
| `validateSlug` | `too-long`          | Longer than `MAX_SLUG_LENGTH` (96)                    |
| `validateSlug` | `invalid-format`    | Not `^[a-z0-9]+(?:-[a-z0-9]+)*$`                     |
| `validateChain`| `empty-chain`       | No segments provided                                |
| `validateChain`| `too-many-levels`   | More than 3 segments                                |
| `validateChain`| `duplicate-slug`    | The same slug appears twice in one chain            |

## CLI usage

The package installs a `oburada-loc` command (or run `node src/cli.js` from a checkout).

```bash
# Slugify a name
oburada-loc slugify "Şanlıurfa"
# sanliurfa

# Validate a chain (exit code 0 = valid, 1 = invalid)
oburada-loc validate turkiye adana seyhan
# valid: turkiye/adana/seyhan
# level: district

oburada-loc validate turkiye adana/seyhan --json
# { "ok": true, "chain": ["turkiye","adana","seyhan"], "level": "district", "errors": [] }

# Build URLs
oburada-loc path turkiye/adana --locale tr
# /tr/turkiye/adana/

oburada-loc path turkiye/adana --locale tr --prefix saglik/hastaneler
# /tr/saglik/hastaneler/turkiye/adana/

oburada-loc path turkiye/adana --locale tr --query
# /tr/?country=turkiye&city=adana
```

Exit codes: `0` success/valid, `1` invalid input, `2` usage error. Add `--json` to
any command for machine-readable output.

## API reference (short)

| Export                | Kind      | Description                                        |
| --------------------- | --------- | -------------------------------------------------- |
| `slugify(input, opts)`| function  | Convert a name into a canonical slug               |
| `isValidSlug(value)`  | function  | `true` if already a valid slug                     |
| `validateSlug(value)` | function  | `{ valid, errors }` for a single segment           |
| `parseChain(input)`   | function  | Normalize input into an array of segments          |
| `validateChain(input)`| function  | `{ valid, chain, normalized, level, errors }`      |
| `describeChain(input)`| function  | `{ country, city, district }`                      |
| `buildQueryPath(input, opts)`     | function | Query-string location URL                |
| `buildCanonicalPath(input, opts)` | function | Path-based location URL                  |
| `LOCATION_LEVELS`     | const     | `["country", "city", "district"]`                  |
| `MAX_CHAIN_LENGTH`    | const     | `3`                                                 |
| `SLUG_PATTERN`        | const     | `^[a-z0-9]+(?:-[a-z0-9]+)*$`                        |
| `MAX_SLUG_LENGTH`     | const     | `96`                                                |

## Tests

Tests use the built-in [`node:test`](https://nodejs.org/api/test.html) runner — no
test framework to install.

```bash
npm test
# or
node --test
```

Coverage of this package:

- `test/slugify.test.js` — Turkish characters, diacritics, spacing/punctuation,
  empty input, `maxLength`, `isValidSlug` positive/negative cases.
- `test/chain.test.js` — `parseChain` variants, `validateSlug` error codes, level
  resolution, empty/over-long/duplicate/malformed chains, `describeChain`.
- `test/url.test.js` — query-string and canonical URL builders, slash normalization.
- `test/cli.test.js` — end-to-end CLI runs: `slugify`, `validate`, `path`, `--json`
  output and exit codes.

## Design notes

- **Deterministic slugs.** `slugify` normalizes to `NFKD`, strips combining marks,
  lowercases and maps the Turkish dotless `ı` to `i`. No locale data is needed.
- **Canonical shape first.** A slug is only valid if it matches `SLUG_PATTERN`;
  everything else is rejected with a specific error code instead of being silently
  rewritten.
- **Explicit levels.** A chain of length *n* maps to the first *n* entries of
  `LOCATION_LEVELS`, so `country` alone is as valid as `country/city/district`.
- **URLs are just helpers.** The builders only assemble strings; routing, redirects
  and rendering stay in your application.

## License

[MIT](./LICENSE) © OBURADA
