#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const runtimeRoot = "test-results/evidence/vouch-referral";
const curatedRoot = "docs/screenshots/vouch-referral";
const runtimeManifest = join(runtimeRoot, "evidence-manifest.json");

if (!existsSync(runtimeManifest)) {
  throw new Error(`No runtime evidence manifest at ${runtimeManifest}; run the proof suite first.`);
}

const manifest = JSON.parse(readFileSync(runtimeManifest, "utf8"));
if (!Array.isArray(manifest.captures) || manifest.captures.length < 20) {
  throw new Error(`Evidence is incomplete: expected at least 20 captures, found ${manifest.captures?.length ?? 0}.`);
}

rmSync(curatedRoot, { recursive: true, force: true });
mkdirSync(curatedRoot, { recursive: true });
for (const capture of manifest.captures) {
  const source = join(runtimeRoot, capture.file);
  if (!existsSync(source)) throw new Error(`Manifest references missing screenshot: ${source}`);
  copyFileSync(source, join(curatedRoot, capture.file));
}
writeFileSync(join(curatedRoot, "evidence-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Curated ${manifest.captures.length} verified screenshots into ${curatedRoot}.`);
