import test from "node:test";
import assert from "node:assert/strict";

import { slugify, isValidSlug } from "../src/slugify.js";

test("slugify transliterates Turkish characters", () => {
  assert.equal(slugify("Şanlıurfa"), "sanliurfa");
  assert.equal(slugify("Çankırı"), "cankiri");
  assert.equal(slugify("İstanbul"), "istanbul");
  assert.equal(slugify("Ağrı"), "agri");
  assert.equal(slugify("Muğla"), "mugla");
  assert.equal(slugify("Aydın"), "aydin");
  assert.equal(slugify("Ödemiş"), "odemis");
});

test("slugify strips general diacritics", () => {
  assert.equal(slugify("São Paulo"), "sao-paulo");
  assert.equal(slugify("Zürich"), "zurich");
  assert.equal(slugify("Malmö"), "malmo");
});

test("slugify normalizes spacing and punctuation", () => {
  assert.equal(slugify("  New   York "), "new-york");
  assert.equal(slugify("Adana (Seyhan)"), "adana-seyhan");
  assert.equal(slugify("--abc--"), "abc");
  assert.equal(slugify("a  -  b"), "a-b");
});

test("slugify returns an empty string for empty input", () => {
  assert.equal(slugify(""), "");
  assert.equal(slugify("   "), "");
  assert.equal(slugify(null), "");
  assert.equal(slugify(undefined), "");
});

test("slugify honours the maxLength option", () => {
  assert.equal(slugify("abcdefghij", { maxLength: 4 }), "abcd");
  // No trailing separator after truncation.
  assert.equal(slugify("abc def ghij", { maxLength: 4 }), "abc");
});

test("isValidSlug accepts canonical slugs", () => {
  assert.equal(isValidSlug("adana"), true);
  assert.equal(isValidSlug("seyhan-2"), true);
  assert.equal(isValidSlug("80-yil"), true);
});

test("isValidSlug rejects malformed slugs", () => {
  assert.equal(isValidSlug("Adana"), false); // uppercase
  assert.equal(isValidSlug("adana-"), false); // trailing dash
  assert.equal(isValidSlug("-adana"), false); // leading dash
  assert.equal(isValidSlug("ad ana"), false); // space
  assert.equal(isValidSlug("ad_ana"), false); // underscore
  assert.equal(isValidSlug(""), false); // empty
  assert.equal(isValidSlug(42), false); // not a string
  assert.equal(isValidSlug("a".repeat(97)), false); // too long
});
