#!/usr/bin/env node
/**
 * Fetch Stitch screens and save HTML + metadata.
 * Usage:
 *   node scripts/fetch-stitch-screen.mjs <screen_id>           # Single screen
 *   node scripts/fetch-stitch-screen.mjs --batch id1,id2,id3   # Multiple screens
 *   node scripts/fetch-stitch-screen.mjs --list                # List all screens
 *
 * Output saved to: docs/stitch-html/<screen_id>.html
 */

import { createWriteStream, mkdirSync, existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve SDK from global install
const SDK_PATH = join(
  process.env.HOME,
  ".nvm/versions/node/v22.14.0/lib/node_modules/@google/stitch-sdk/dist/src/client.js"
);
const { StitchToolClient } = await import(SDK_PATH);

const PROJECT_ID = "15021896094385971092";
const API_KEY = process.env.STITCH_API_KEY || "AQ.Ab8RN6L7qyBwFTuJ_tY1jFRhn52C7qfk0-Jzb-UytQH6wXABDQ";
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "stitch-html");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const client = new StitchToolClient({ apiKey: API_KEY });
await client.connect();

const args = process.argv.slice(2);

if (args[0] === "--list") {
  const result = await client.callTool("list_screens", { projectId: PROJECT_ID });
  const screens = result.screens || [];
  console.log(`Total screens: ${screens.length}\n`);
  for (const s of screens) {
    const id = s.name?.split("/").pop() || "unknown";
    console.log(`${id} | ${s.title} | ${s.width}x${s.height}`);
  }
  await client.close();
  process.exit(0);
}

const ids = args[0] === "--batch" ? args[1].split(",") : [args[0]];

if (!ids[0]) {
  console.error("Usage: node scripts/fetch-stitch-screen.mjs <screen_id>");
  await client.close();
  process.exit(1);
}

for (const id of ids) {
  const trimId = id.trim();
  console.log(`\nFetching: ${trimId}...`);
  try {
    const screen = await client.callTool("get_screen", {
      projectId: PROJECT_ID,
      screenId: trimId,
    });

    console.log(`  Title: ${screen.title}`);
    console.log(`  Size: ${screen.width}x${screen.height}`);

    // Save metadata
    const meta = {
      id: trimId,
      title: screen.title,
      width: screen.width,
      height: screen.height,
      screenshotUrl: screen.screenshot?.downloadUrl,
    };
    await writeFile(join(OUT_DIR, `${trimId}.meta.json`), JSON.stringify(meta, null, 2));

    // Fetch and save HTML
    if (screen.htmlCode?.downloadUrl) {
      const resp = await fetch(screen.htmlCode.downloadUrl);
      const html = await resp.text();
      await writeFile(join(OUT_DIR, `${trimId}.html`), html);
      console.log(`  HTML: ${html.length} chars → docs/stitch-html/${trimId}.html`);
    }
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
  }
}

await client.close();
console.log("\nDone!");
