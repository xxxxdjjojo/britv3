# Lint Guardrails

How TrueDeed keeps `pnpm lint` at **0 errors** and stops them silently accumulating.

## Why this exists

Between the Next 16 / `eslint-config-next` 16 / React 19 upgrade (which switched on
the React Compiler / `react-hooks` "recommended-latest" rules at *error* severity) and
a CI Lint step marked `continue-on-error: true` ("Sprint 1 ship; pre-existing issues
tracked as Sprint 2 cleanup"), **48 ESLint errors accumulated unnoticed**. PR #83
cleared all 48. These guardrails keep the count at zero.

A second, subtler trap: a branch cut *before* the cleanup still shows the old 48 errors
until it is updated from `main`. A stale branch merging an old base re-introduces the
problem — see "Require up-to-date with main" below.

## The three guardrails

### 1. CI gate (enforced)

`.github/workflows/app-ci.yml` runs `pnpm lint` **without** `continue-on-error`. Any PR
that introduces an ESLint **error** fails the required `app` check. `pnpm lint` fails
only on errors; the ~111 existing **warnings** stay non-blocking (we do not pass
`--max-warnings 0`).

### 2. Local pre-commit (fast feedback)

`husky` + `lint-staged` run `eslint --fix` on staged `*.{ts,tsx}` before every commit:

- Auto-fixable issues (e.g. `prefer-const`) are fixed and re-staged silently.
- Unfixable errors (e.g. `no-console`) **block the commit** and revert to the pre-task state.

Setup is automatic: `pnpm install` runs the `prepare` script (`husky`), which installs
the git hook. No manual step. To bypass in an emergency: `git commit --no-verify`
(discouraged — CI will still catch it).

### 3. Require up-to-date with main (prevents the stale-base trap)

Enable in **GitHub → Settings → Branches → Branch protection rule for `main`**:

1. Check **"Require status checks to pass before merging."**
2. Check **"Require branches to be up to date before merging."**
3. Add **`app`** (the App CI job) to the required checks.

This forces a branch to rebase/merge `main` before it can land, so it always inherits the
latest lint state instead of merging an old, error-laden base.

## If lint fails

1. `pnpm lint` locally to see the errors.
2. Fix the underlying code — escape JSX entities, type the value instead of `any`, move
   hooks above early returns, hoist impure calls (`Date.now()`) into module-level helpers.
3. For a genuine React Compiler false positive (e.g. mount-time `window`/`navigator` sync,
   an a11y announcement), use a **targeted** `// eslint-disable-next-line <rule> -- <why>`
   with a reason — never a blanket file/rule disable.
