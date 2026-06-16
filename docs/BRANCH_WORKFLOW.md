# Branch & Landing Workflow

> Single-`main`, PR-gated, squash-only. This repo runs many parallel agents in isolated worktrees — this discipline is what keeps that from sprawling into dozens of un-landed branches.

## The invariant

`origin/main` is the **only** source of truth and the **only** long-lived branch. Every change either **lands** (squash-merged to `main`) or is **closed**. Nothing lingers.

## The loop (every change, every agent)

1. **Start synced, in your own worktree.**
   ```bash
   git fetch origin
   git worktree add ../wt-<name> -b <type>/<scope> origin/main
   ```
   `<type>` ∈ `feat|fix|chore|perf|docs|test|refactor`. **One agent = one worktree.** Never branch-switch a shared checkout or edit another agent's worktree (that corrupts their work).
2. **Keep it small** — one PR's worth (< ~1 day). If it's growing, split it.
3. **Go green locally:** `pnpm lint` (0 errors), `pnpm build` (exit 0), `pnpm test`, and `pnpm check:migrations` once that script exists.
4. **Open a PR to `main`.** CI must pass. Use gstack `/ship` then `/land-and-deploy`.
5. **Squash-merge.** The branch auto-deletes (repo setting). Remove your worktree: `git worktree remove ../wt-<name>`.

## Hard rules (no exceptions)

- No long-lived feature branches. No "I'll merge it later."
- **Squash-merge only** — merge commits and rebase-merges are disabled on `main`.
- Every branch must have an open PR within **48h** of its first commit, or it is closed.
- A PR red for **> 24h** is fixed or closed.
- Merged branches and their worktrees are deleted immediately.

## Multi-agent rule

Each agent works in its **own** worktree off the **latest** `origin/main`. Agents never share a working tree and never branch-switch a checkout another agent is using. This is enforced by habit + the `branch-sweep` workflow; isolation is the only thing that makes parallel agents safe here.

## Automated enforcement

- **Branch protection** on `main`: required PR + required CI status check; no direct pushes.
- **Squash-only** merges + **auto-delete head branch on merge** (repo settings).
- **`.github/workflows/branch-sweep.yml`** — scheduled daily report of branches with no open PR (> 48h) and stale/red PRs. Report-only first; escalates to auto-closing zombie branches (no commits for 5+ days) once trusted. Branches with recent commits are never auto-closed, so live work is safe.

## One-time consolidation runbook (how we got to a single main)

Run once, with all agents frozen:

0. **Freeze** all concurrent agents.
1. **Sync the trunk:** in a dedicated worktree, save any unique local-`main` commits to a branch, then `git reset --hard origin/main`.
2. **Enable the structural gate:** branch protection + squash-only + auto-delete (above).
3. **Land the unmerged real work**, security and migration fixes first, each via rebase → PR → squash-merge → auto-delete. Fix any branch whose build is broken before it lands.
4. **Reconcile overlaps** (e.g. duplicate migration / map branches) into one PR each.
5. **Purge:** delete already-merged local branches + stale worktrees; close pre-restructure PRs; merge/close dependabot PRs.
6. **Collapse worktrees:** one canonical checkout + only actively-used isolated worktrees.
