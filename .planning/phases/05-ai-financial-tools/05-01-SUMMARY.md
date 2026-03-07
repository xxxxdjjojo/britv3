---
phase: 05-ai-financial-tools
plan: 01
subsystem: ai
tags: [anthropic, claude-sdk, upstash, ratelimit, ai-descriptions, feedback]

requires:
  - phase: 01-foundation
    provides: Supabase client factories, auth types, UI components

provides:
  - Centralized AI service wrapper (callClaude) with rate limiting and cost controls
  - Property description generation with 3-tone prompt templates
  - AI description generation API route with auth and regeneration limits
  - AI feedback collection component (thumbs up/down with comments)
  - useAiDescription hook for client-side generation state

affects: [05-ai-financial-tools, future-ai-features]

tech-stack:
  added: ["@anthropic-ai/sdk", "@upstash/ratelimit", "@upstash/redis", "@react-pdf/renderer", "recharts"]
  patterns: ["AI service wrapper with graceful degradation", "Dual rate limiting (global + per-user)", "Daily spend kill switch", "TDD for service layer"]

key-files:
  created:
    - britv3.0/src/services/ai/types.ts
    - britv3.0/src/services/ai/claude-service.ts
    - britv3.0/src/services/ai/claude-service.test.ts
    - britv3.0/src/services/ai/description-generator.ts
    - britv3.0/src/services/ai/description-generator.test.ts
    - britv3.0/src/config/prompts/property-description.ts
    - britv3.0/src/app/api/ai/generate-description/route.ts
    - britv3.0/src/hooks/useAiDescription.ts
    - britv3.0/src/components/ai/GenerateDescriptionButton.tsx
    - britv3.0/src/components/ai/AiFeedback.tsx
    - britv3.0/src/components/ai/AiFeedback.test.tsx
  modified: []

key-decisions:
  - "Vitest v4 requires function keyword for mock constructors (not arrow functions)"
  - "Used button-based tone selector instead of Shadcn ToggleGroup (not yet installed)"
  - "Claude Haiku 4.5 selected as model for cost efficiency ($1/1M input, $5/1M output)"
  - "Rate limiters lazy-initialized to avoid issues when env vars missing"

patterns-established:
  - "AI service wrapper: all AI calls route through callClaude for centralized cost/rate control"
  - "Graceful degradation: AI functions return null on failure, never throw to callers"
  - "Usage logging: every successful AI call logged to ai_usage_log table"

requirements-completed: [AI-01, AI-02, AI-06]

duration: 32min
completed: 2026-03-07
---

# Phase 5 Plan 1: AI Service Layer & Property Description Generation Summary

**Centralized Claude API wrapper with dual rate limiting, daily spend kill switch, and 3-tone property description generation with feedback collection**

## Performance

- **Duration:** 32 min
- **Started:** 2026-03-07T18:10:23Z
- **Completed:** 2026-03-07T18:42:16Z
- **Tasks:** 3
- **Files created:** 11

## Accomplishments
- AI service layer wrapping Anthropic SDK with global (100/min) and per-user (10/hr) rate limiting via Upstash
- Daily spend kill switch ($10 default) querying ai_usage_log table
- Property description generator with 3 British English tone templates (professional, friendly, premium)
- POST /api/ai/generate-description endpoint with auth, Zod validation, and max 3 regenerations per listing
- Client-side useAiDescription hook and GenerateDescriptionButton with tone selector
- AiFeedback component with thumbs up/down and optional comment textarea
- 18 tests passing across 3 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create AI service layer** - `b65dc77` (feat)
2. **Task 2: Description generator (TDD RED)** - `791ff8a` (test)
3. **Task 2: Description generator (TDD GREEN)** - `bbc560a` (feat)
4. **Task 3: AI description UI components and feedback** - `e827708` (feat)
5. **Task 3: Lint fixes** - `b8b43f0` (fix)

## Files Created/Modified
- `britv3.0/src/services/ai/types.ts` - AI domain types (AiCallResult, AiCallOptions, AiUsageLogEntry, AiFeedbackEntry)
- `britv3.0/src/services/ai/claude-service.ts` - Centralized AI wrapper with rate limiting, spend tracking, usage logging
- `britv3.0/src/services/ai/claude-service.test.ts` - 6 tests covering success, rate limits, spend limits, error handling
- `britv3.0/src/services/ai/description-generator.ts` - Property description generation with buildUserMessage
- `britv3.0/src/services/ai/description-generator.test.ts` - 6 tests for prompts, generation, null handling
- `britv3.0/src/config/prompts/property-description.ts` - 3-tone prompt templates (professional, friendly, premium)
- `britv3.0/src/app/api/ai/generate-description/route.ts` - POST endpoint with auth, validation, regen limit
- `britv3.0/src/hooks/useAiDescription.ts` - Client hook for description generation state
- `britv3.0/src/components/ai/GenerateDescriptionButton.tsx` - Tone selector + generate button with loading state
- `britv3.0/src/components/ai/AiFeedback.tsx` - Thumbs up/down feedback with optional comment
- `britv3.0/src/components/ai/AiFeedback.test.tsx` - 6 tests for feedback component

## Decisions Made
- Used Claude Haiku 4.5 model for cost efficiency
- Lazy-initialized rate limiters to avoid startup errors when Upstash env vars are missing
- Used button-based tone selector instead of Shadcn ToggleGroup (component not yet installed)
- Vitest v4 mock constructors require `function` keyword, not arrow functions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Vitest v4 mock constructor pattern**
- **Found during:** Task 1 (claude-service tests)
- **Issue:** Vitest v4 requires `function` keyword for mock constructors, arrow functions don't work as constructors
- **Fix:** Changed Ratelimit and Anthropic mocks to use `vi.fn(function() { ... })` pattern
- **Files modified:** britv3.0/src/services/ai/claude-service.test.ts
- **Committed in:** b65dc77

**2. [Rule 1 - Bug] Fixed lint errors in AI components**
- **Found during:** Task 3 verification
- **Issue:** Unused `selectedRating` state and ref access during render
- **Fix:** Removed unused state, replaced useRef with direct prop reference in useEffect deps
- **Files modified:** AiFeedback.tsx, GenerateDescriptionButton.tsx
- **Committed in:** b8b43f0

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Minor fixes for test infrastructure compatibility and lint compliance. No scope creep.

## Issues Encountered
- Pre-existing TypeScript error in marketplace/booking-service.ts prevents full build -- not related to AI code, logged as out-of-scope
- Pre-existing lint warnings in marketplace code (3 errors, 13 warnings) -- all in unrelated files

## User Setup Required
None - no external service configuration required. Environment variables (ANTHROPIC_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) are already documented in .env.example.

## Next Phase Readiness
- AI service layer ready for all future AI features to route through callClaude
- Description generation endpoint ready for integration with listing creation UI
- Feedback mechanism ready for deployment with any AI-generated content

---
*Phase: 05-ai-financial-tools*
*Completed: 2026-03-07*
