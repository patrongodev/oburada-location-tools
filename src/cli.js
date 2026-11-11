#!/usr/bin/env node
/**
 * Command line interface for oburada-location-tools.
 *
 * Commands:
 *   slugify <name>
 *   validate <country>[/<city>[/<district>]]
 *   path <country>[/<city>[/<district>]] [--locale <code>] [--prefix <section>] [--query]
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { slugify } from "./slugify.js";
import { validateChain, describeChain } from "./chain.js";
import { buildQueryPath, buildCanonicalPath } from "./url.js";
import { LOCATION_LEVELS } from "./validate.js";

const HELP = `oburada-loc - validate and build location slug chains

Usage:
  oburada-loc slugify <name>
  oburada-loc validate <country>[/<city>[/<district>]]
  oburada-loc path <country>[/<city>[/<district>]] [--locale <code>] [--prefix <section>] [--query]

Arguments:
  chain    Slugs separated by "/", or several arguments: turkiye adana seyhan
  levels   ${LOCATION_LEVELS.join(" -> ")}

Options:
  --json           Print machine-readable JSON.
  --locale <code>  Locale segment for URLs (e.g. tr, en).
  --prefix <path>  Extra canonical path segments (e.g. saglik/hastaneler).
  --query          Build the query-string URL instead of the canonical path.
  -h, --help       Show this help.
  -v, --version    Show version.

Exit codes:
  0  success / valid
  1  invalid input
  2  usage error
`;

function readVersion() {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function die(message, code) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(code);
}

function parseArgs(argv) {
  const options = { json: false, locale: undefined, prefix: undefined, query: false };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--json") {
      options.json = true;
    } else if (token === "--query") {
      options.query = true;
    } else if (token === "--locale" || token === "--prefix") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        die(`option ${token} needs a value`, 2);
      }
      options[token.slice(2)] = value;
      i += 1;
    } else if (token === "-h" || token === "--help") {
      process.stdout.write(HELP);
      process.exit(0);
    } else if (token === "-v" || token === "--version") {
      process.stdout.write(`${readVersion()}\n`);
      process.exit(0);
    } else if (token.startsWith("-")) {
      die(`unknown option: ${token}`, 2);
    } else {
      positional.push(token);
    }
  }

  return { options, positional };
}

function printJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function runSlugify(positional, options) {
  const text = positional.join(" ").trim();
  if (text.length === 0) {
    die("slugify needs a name, e.g. oburada-loc slugify \"Şanlıurfa\"", 2);
  }

  const slug = slugify(text);

  if (options.json) {
    printJson({ ok: true, command: "slugify", input: text, slug });
  } else {
    process.stdout.write(`${slug}\n`);
  }
}

function runValidate(positional, options) {
  // Accept both "turkiye/adana/seyhan" and "turkiye adana seyhan".
  const input = positional.join("/");
  const result = validateChain(input);

  if (options.json) {
    printJson({
      ok: result.valid,
      command: "validate",
      chain: result.chain,
      normalized: result.normalized,
      level: result.level,
      errors: result.errors,
    });
  } else if (result.valid) {
    process.stdout.write(`valid: ${result.normalized}\n`);
    process.stdout.write(`level: ${result.level}\n`);
  } else {
    process.stdout.write(`invalid: ${result.normalized || "(empty)"}\n`);
    for (const error of result.errors) {
      process.stdout.write(`  - [${error.code}] ${error.message}\n`);
    }
  }

  process.exit(result.valid ? 0 : 1);
}

function runPath(positional, options) {
  // Accept both "turkiye/adana/seyhan" and "turkiye adana seyhan".
  const input = positional.join("/");
  const result = validateChain(input);

  if (!result.valid) {
    if (options.json) {
      printJson({ ok: false, command: "path", errors: result.errors });
    } else {
      process.stdout.write(`invalid: ${result.normalized || "(empty)"}\n`);
      for (const error of result.errors) {
        process.stdout.write(`  - [${error.code}] ${error.message}\n`);
      }
    }
    process.exit(1);
  }

  const buildOptions = { locale: options.locale, prefix: options.prefix };
  const url = options.query ? buildQueryPath(input, buildOptions) : buildCanonicalPath(input, buildOptions);

  if (options.json) {
    printJson({
      ok: true,
      command: "path",
      mode: options.query ? "query" : "canonical",
      chain: result.chain,
      level: result.level,
      levels: describeChain(input),
      url,
    });
  } else {
    process.stdout.write(`${url}\n`);
  }
}

function main() {
  const { options, positional } = parseArgs(process.argv.slice(2));
  const command = positional.shift();

  switch (command) {
    case "slugify":
      runSlugify(positional, options);
      break;
    case "validate":
      runValidate(positional, options);
      break;
    case "path":
      runPath(positional, options);
      break;
    default:
      process.stderr.write(HELP);
      process.exit(2);
  }
}

main();
