import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "src", "cli.js");

function run(args) {
  return new Promise((resolve) => {
    execFile(process.execPath, [cli, ...args], (error, stdout, stderr) => {
      resolve({ code: error ? error.code : 0, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

test("cli slugify prints a canonical slug", async () => {
  const result = await run(["slugify", "Şanlıurfa"]);
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "sanliurfa");
});

test("cli validate accepts a slash-separated chain", async () => {
  const result = await run(["validate", "turkiye/adana/seyhan"]);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /valid: turkiye\/adana\/seyhan/);
  assert.match(result.stdout, /level: district/);
});

test("cli validate accepts space-separated arguments", async () => {
  const result = await run(["validate", "turkiye", "adana"]);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /level: city/);
});

test("cli validate exits 1 on invalid input and reports JSON", async () => {
  const result = await run(["validate", "Turkiye", "--json"]);
  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.errors[0].code, "invalid-format");
});

test("cli path builds canonical and query URLs", async () => {
  const canonical = await run(["path", "turkiye/adana", "--locale", "tr", "--prefix", "saglik/hastaneler"]);
  assert.equal(canonical.code, 0);
  assert.equal(canonical.stdout, "/tr/saglik/hastaneler/turkiye/adana/");

  const query = await run(["path", "turkiye/adana", "--locale", "tr", "--query"]);
  assert.equal(query.stdout, "/tr/?country=turkiye&city=adana");
});

test("cli rejects an unknown command with usage exit code", async () => {
  const result = await run(["nope"]);
  assert.equal(result.code, 2);
});
