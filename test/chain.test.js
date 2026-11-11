import test from "node:test";
import assert from "node:assert/strict";

import { parseChain, validateChain, describeChain } from "../src/chain.js";
import { validateSlug } from "../src/validate.js";

test("parseChain accepts strings, arrays and empty input", () => {
  assert.deepEqual(parseChain("turkiye/adana/seyhan"), ["turkiye", "adana", "seyhan"]);
  assert.deepEqual(parseChain("turkiye, adana"), ["turkiye", "adana"]);
  assert.deepEqual(parseChain(["turkiye", " adana "]), ["turkiye", "adana"]);
  assert.deepEqual(parseChain("turkiye//adana/"), ["turkiye", "adana"]);
  assert.deepEqual(parseChain(null), []);
  assert.deepEqual(parseChain(undefined), []);
});

test("validateSlug reports specific error codes", () => {
  assert.equal(validateSlug("adana").valid, true);
  assert.equal(validateSlug("Adana").errors[0].code, "invalid-format");
  assert.equal(validateSlug("").errors[0].code, "empty-slug");
  assert.equal(validateSlug(42).errors[0].code, "not-a-string");
  assert.equal(validateSlug("a".repeat(120)).errors[0].code, "too-long");
});

test("validateChain resolves the correct level", () => {
  assert.equal(validateChain("turkiye").level, "country");
  assert.equal(validateChain("turkiye/adana").level, "city");
  assert.equal(validateChain("turkiye/adana/seyhan").level, "district");
});

test("validateChain accepts valid chains", () => {
  const result = validateChain("turkiye/adana/seyhan");
  assert.equal(result.valid, true);
  assert.deepEqual(result.chain, ["turkiye", "adana", "seyhan"]);
  assert.equal(result.normalized, "turkiye/adana/seyhan");
  assert.deepEqual(result.errors, []);
});

test("validateChain rejects empty and over-long chains", () => {
  assert.equal(validateChain("").errors[0].code, "empty-chain");
  assert.equal(validateChain("a/b/c/d").errors[0].code, "too-many-levels");
});

test("validateChain rejects duplicate and malformed segments", () => {
  const duplicate = validateChain("adana/adana");
  assert.equal(duplicate.valid, false);
  assert.ok(duplicate.errors.some((error) => error.code === "duplicate-slug"));

  const malformed = validateChain("Turkiye/adana");
  assert.equal(malformed.valid, false);
  assert.ok(malformed.errors.some((error) => error.code === "invalid-format" && error.index === 0));
});

test("describeChain maps segments to level names", () => {
  assert.deepEqual(describeChain("turkiye/adana/seyhan"), {
    country: "turkiye",
    city: "adana",
    district: "seyhan",
  });
  assert.deepEqual(describeChain("turkiye"), { country: "turkiye" });
});
