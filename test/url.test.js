import test from "node:test";
import assert from "node:assert/strict";

import { buildQueryPath, buildCanonicalPath } from "../src/url.js";

test("buildQueryPath builds query-string location URLs", () => {
  assert.equal(buildQueryPath("turkiye"), "/?country=turkiye");
  assert.equal(buildQueryPath("turkiye/adana"), "/?country=turkiye&city=adana");
  assert.equal(
    buildQueryPath("turkiye/adana/seyhan"),
    "/?country=turkiye&city=adana&district=seyhan",
  );
  assert.equal(
    buildQueryPath("turkiye/adana/seyhan", { locale: "tr" }),
    "/tr/?country=turkiye&city=adana&district=seyhan",
  );
});

test("buildCanonicalPath builds path-based location URLs", () => {
  assert.equal(buildCanonicalPath("turkiye/adana"), "/turkiye/adana/");
  assert.equal(
    buildCanonicalPath("turkiye/adana", { locale: "tr" }),
    "/tr/turkiye/adana/",
  );
  assert.equal(
    buildCanonicalPath("turkiye/adana/seyhan", { locale: "tr", prefix: "saglik/hastaneler" }),
    "/tr/saglik/hastaneler/turkiye/adana/seyhan/",
  );
});

test("builders normalize slash handling", () => {
  assert.equal(buildCanonicalPath("/turkiye//adana/"), "/turkiye/adana/");
  assert.equal(buildCanonicalPath("turkiye", { locale: "/tr/" }), "/tr/turkiye/");
});
