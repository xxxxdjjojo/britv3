#!/usr/bin/env node
/**
 * Dev-server clone/branch guard.
 *
 * The site has been bitten by multi-clone drift: a feature built on one branch
 * in one of several sibling clones, while `next dev` ran from a *different*
 * clone that lacked the feature ("we built it but there's nowhere to see it").
 *
 * This prints which clone + branch is about to be served and warns loudly if it
 * is not the canonical clone. Non-blocking — it never stops `dev`.
 *
 * Canonical clone basename. Override with CANONICAL_CLONE if you rename it.
 */
import { basename } from "node:path";
import { execFileSync } from "node:child_process";

const CANONICAL = process.env.CANONICAL_CLONE ?? "britv3";

const cwd = process.cwd();
const clone = basename(cwd);

let branch = "(unknown)";
try {
  branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    encoding: "utf8",
  }).trim();
} catch {
  /* not a git checkout — ignore */
}

const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

console.log(dim("────────────────────────────────────────────"));
console.log(`  serving clone: ${clone === CANONICAL ? green(clone) : yellow(clone)}`);
console.log(`  branch:        ${branch}`);
console.log(dim(`  path:          ${cwd}`));

if (clone !== CANONICAL) {
  console.log(
    yellow(
      `  ⚠  This is NOT the canonical clone (${CANONICAL}). Features merged ` +
        `into ${CANONICAL}/main may be missing here. Extra working copies\n` +
        `     should be git worktrees of ${CANONICAL}, not separate clones.`,
    ),
  );
}
console.log(dim("────────────────────────────────────────────"));
