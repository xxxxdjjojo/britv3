# CLAUDE.md
 ## Claude Code Guidelines
         3 +  This file provides guidance to Claude Code (claude.ai/code) when working with code 
     in this repository.
           + in this repository.
         4 +  
         5 +  ## Project Overview
         6 +  
         7 +  Britestate is a comprehensive UK property platform built with Next.js 14, 
           + TypeScript, and Supabase. It serves multiple user types including homebuyers, 
           + service providers, estate agents, and landlords.
         8 +  
         9 +  ## Development Commands
        10 +  
        11 +  ### Building and Running
        12 +  ```bash
        13 +  # Development server (runs on port 3004)
        14 +  npm run dev
        15 +  
        16 +  # Production build
        17 +  npm run build
        18 +  npm run start
        19 +  
        20 +  # Type checking and linting
        21 +  npm run typecheck
        22 +  npm run lint
        23 +  ```
        24 +  
        25 +  ### Testing Commands
        26 +  ```bash
        27 +  # Unit tests with Vitest
        28 +  npm test                    # Run tests
        29 +  npm run test:watch         # Watch mode
        30 +  npm run test:ui            # UI mode
        31 +  npm run test:coverage      # Coverage report
        32 +  
        33 +  # E2E tests with Playwright
        34 +  npm run test:e2e           # Run all E2E tests
        35 +  npm run test:e2e:headed    # Run with browser visible
        36 +  npm run test:e2e:debug     # Debug mode
        37 +  npm run test:e2e:report    # Show test report
        38 +  
        39 +  # Integration tests
        40 +  npm run test:integration   # Run integration tests
        41 +  npm run test:journey       # User journey tests
        42 +  ```
        43 +  
        44 +  ### Database and Supabase
        45 +  ```bash
        46 +  # Query Supabase database
        47 +  npm run supabase:query     # Interactive query tool
        48 +  npm run supabase:tables    # List all tables
        49 +  npm run supabase:schema    # Show schema details
        50 +  ```
        51 +  
        52 +  ## Architecture Overview
        53 +  
        54 +  ### Tech Stack
        55 +  - **Frontend**: Next.js 14 (App Router), React 18, TypeScript
        56 +  - **Styling**: TailwindCSS, Shadcn UI components
        57 +  - **State Management**: React Context + React Query
        58 +  - **Backend**: Supabase (Auth, Database, Real-time, Storage)
        59 +  - **Testing**: Vitest (unit), Playwright (E2E)
        60 +  - **Deployment**: Standalone Next.js with Docker support
        61 +  
        62 +  ### Directory Structure
        63 +  ```
        64 +  src/
        65 +  ├── app/                   # Next.js app directory (routes)
        66 +  │   ├── (main)/           # Public routes
        67 +  │   ├── dashboard/        # Protected dashboard routes
        68 +  │   │   ├── homebuyer/    # Homebuyer dashboard
        69 +  │   │   ├── provider/     # Service provider dashboard
        70 +  │   │   ├── agent/        # Estate agent dashboard
        71 +  │   │   ├── landlord/     # Landlord dashboard
        72 +  │   │   └── renter/       # Renter dashboard
        73 +  │   └── api/              # API routes
        74 +  ├── components/           # React components
        75 +  │   ├── ui/              # Shadcn UI components
        76 +  │   ├── navigation/      # Navigation components
        77 +  │   ├── properties/      # Property-related components
        78 +  │   ├── auth/            # Authentication components
        79 +  │   └── [feature]/       # Feature-specific components
        80 +  ├── contexts/            # React contexts
        81 +  ├── hooks/               # Custom React hooks
        82 +  ├── services/            # API and service functions
        83 +  ├── lib/                 # Utility functions
        84 +  └── types/               # TypeScript type definitions
        85 +  ```
        86 +  
        87 +  ### Key Patterns
        88 +  
        89 +  1. **Authentication Flow**
        90 +     - Supabase Auth handles user authentication
        91 +     - Role-based access with protected routes
        92 +     - Professional verification system for service providers
        93 +  
        94 +  2. **Data Fetching**
        95 +     - React Query for server state management
        96 +     - Optimistic updates for better UX
        97 +     - Real-time updates via Supabase subscriptions
        98 +  
        99 +  3. **Component Patterns**
       100 +     - Feature-based organization
       101 +     - Composition over inheritance
       102 +     - Shadcn UI for consistent design system
       103 +  
       104 +  4. **State Management**
       105 +     - Context API for global state (auth, preferences)
       106 +     - React Query for server state
       107 +     - Local state for component-specific data
       108 +  
       109 +  ## Important Considerations
       110 +  
       111 +  ### Environment Variables
       112 +  - Client-side vars must be prefixed with `NEXT_PUBLIC_`
       113 +  - Server-side vars should not have this prefix
       114 +  - Required variables:
       115 +    - `NEXT_PUBLIC_SUPABASE_URL`
       116 +    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
       117 +    - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
       118 +  
       119 +  ### Performance Optimization
       120 +  - Images use Next.js Image component with optimization
       121 +  - Code splitting by route
       122 +  - Lazy loading for heavy components
       123 +  - React Query caching for API responses
       124 +  
       125 +  ### Testing Strategy
       126 +  - Unit tests for utilities and hooks
       127 +  - Integration tests for API routes
       128 +  - E2E tests for critical user journeys
       129 +  - Visual regression tests for UI comp


       
## Claude Code Guidelines
*Based on best practices by Sabrina Ramonov*

### Purpose & Philosophy

These guidelines ensure **maintainability**, **safety**, and **developer velocity**.  
- **MUST** rules are enforced by CI/CD and are non-negotiable
- **SHOULD** rules are strongly recommended best practices
- **SHOULD NOT** rules indicate patterns to avoid

---

## 1. Before Coding

### Planning & Communication

- **BP-1 (MUST)** Ask clarifying questions before implementation
  - Understand the full scope and edge cases
  - Confirm expected behavior for ambiguous scenarios
  - Validate assumptions about existing code
  - If you unsure about code or fiels, open them-do bot hallucinate
  - Always think hard

- **BP-2 (SHOULD)** Draft and confirm approach for complex work
  - Write a brief implementation plan for features touching 3+ files
  - Plan thoutoughly before every tool call and reflect on the outcome after
  - For maximum efficiency, whenever you need to perform multiple independent operations, invoke all      relevant tools simultaneously rather than sequentially.
  - Include data flow diagrams for complex state management
  - Document API contract changes before implementation

- **BP-3 (SHOULD)** When ≥ 2 approaches exist, provide clear analysis:
  ```
  Option A: [Description]
  ✅ Pros: Performance, simplicity
  ❌ Cons: More memory usage
  
  Option B: [Description]
  ✅ Pros: Memory efficient, follows existing patterns
  ❌ Cons: Slightly more complex
  ```

---

## 2. While Coding

### Development Methodology

- **C-1 (MUST)** Follow Test-Driven Development (TDD):
  1. Create function stub with correct signature
  2. Write failing test that defines expected behavior
  3. Implement minimal code to pass test
  4. Refactor while keeping tests green

### Code Style & Structure

- **C-2 (MUST)** Use consistent domain vocabulary
  ```ts
  // ✅ Good - matches existing codebase terminology
  function publishToSocialMedia(post: SocialPost) { }
  
  // ❌ Bad - introduces new terminology
  function sendToNetwork(content: NetworkContent) { }
  ```

- **C-3 (SHOULD NOT)** Introduce classes when functions suffice
  ```ts
  // ✅ Good - simple, testable function
  export function calculateEngagementRate(likes: number, views: number): number {
    return views > 0 ? (likes / views) * 100 : 0;
  }
  
  // ❌ Bad - unnecessary class
  export class EngagementCalculator {
    calculate(likes: number, views: number): number {
      return views > 0 ? (likes / views) * 100 : 0;
    }
  }
  ```

- **C-4 (SHOULD)** Prefer simple, composable, testable functions
  - Single responsibility principle
  - Pure functions when possible
  - Explicit dependencies via parameters

### TypeScript Best Practices

- **C-5 (MUST)** Use branded types for domain identifiers
  ```ts
  // ✅ Good - type-safe IDs
  type UserId = Brand<string, 'UserId'>;
  type PostId = Brand<string, 'PostId'>;
  
  // ❌ Bad - primitive obsession
  type UserId = string;
  type PostId = string;
  ```

- **C-6 (MUST)** Use `import type` for type-only imports
  ```ts
  // ✅ Good
  import type { User, Post } from './types';
  import { createUser } from './user';
  
  // ❌ Bad
  import { User, Post, createUser } from './module';
  ```

- **C-7 (SHOULD NOT)** Add comments except for critical caveats
  ```ts
  // ✅ Good - self-documenting code
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // ❌ Bad - obvious comments
  function isValidEmail(email: string): boolean {
    // Check if email is valid using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Email regex pattern
    return emailRegex.test(email); // Test the email
  }
  
  // ✅ Good - critical caveat
  // IMPORTANT: This regex allows Unicode characters in domain names
  // which may not be supported by all email servers
  ```

- **C-8 (SHOULD)** Default to `type`; use `interface` only when:
  - Interface merging is explicitly needed
  - Extending existing interfaces
  - It significantly improves readability

- **C-9 (SHOULD NOT)** Extract functions unless:
  - The function will be reused elsewhere
  - It's the only way to unit-test isolated logic
  - It drastically improves readability of complex logic

---

## 3. Testing

### Test Organization

- **T-1 (MUST)** Colocate unit tests with source files
  ```
  src/
    user.ts
    user.spec.ts
    post/
      post.ts
      post.spec.ts
  ```

- **T-2 (MUST)** Add integration tests for API changes
  - Location: `packages/api/test/*.spec.ts`
  - Test full request/response cycle
  - Verify error handling and edge cases

- **T-3 (MUST)** Separate pure unit tests from integration tests
  ```ts
  // unit test - no external dependencies
  describe('calculatePrice', () => {
    test('applies discount correctly', () => {
      expect(calculatePrice(100, 0.2)).toBe(80);
    });
  });
  
  // integration test - touches database
  describe('createOrder', () => {
    test('persists order to database', async () => {
      const order = await createOrder(db, orderData);
      expect(await db.orders.findById(order.id)).toBeDefined();
    });
  });
  ```

### Testing Best Practices

- **T-4 (SHOULD)** Prefer integration tests over heavy mocking
- **T-5 (SHOULD)** Thoroughly test complex algorithms with edge cases
- **T-6 (SHOULD)** Test complete structures in single assertions
  ```ts
  // ✅ Good - complete assertion
  expect(result).toEqual({
    id: '123',
    name: 'Test User',
    email: 'test@example.com'
  });
  
  // ❌ Bad - fragmented assertions
  expect(result.id).toBe('123');
  expect(result.name).toBe('Test User');
  expect(result.email).toBe('test@example.com');
  ```

### Test Quality Checklist

1. **Parameterize inputs** - No magic numbers or strings
   ```ts
   // ✅ Good
   const testPrice = 100;
   const testDiscount = 0.2;
   expect(calculatePrice(testPrice, testDiscount)).toBe(80);
   
   // ❌ Bad
   expect(calculatePrice(100, 0.2)).toBe(80);
   ```

2. **Only test what can fail** - Skip trivial assertions
3. **Clear test descriptions** - Description matches assertion
4. **Independent verification** - Don't use function output as oracle
5. **Follow code standards** - Prettier, ESLint, types
6. **Test invariants** - Use property-based testing when applicable
   ```ts
   import fc from 'fast-check';
   
   test('concatenation is associative', () => {
     fc.assert(
       fc.property(
         fc.string(), fc.string(), fc.string(),
         (a, b, c) => concat(concat(a, b), c) === concat(a, concat(b, c))
       )
     );
   });
   ```

7. **Group by function** - `describe(functionName, () => ...)`
8. **Use matchers wisely** - `expect.any(Date)` for dynamic values
9. **Strong assertions** - `toEqual(1)` not `toBeGreaterThanOrEqual(1)`
10. **Comprehensive coverage** - Edge cases, boundaries, invalid input

---

## 4. Database

### Database Access Patterns

- **D-1 (MUST)** Type database helpers for flexibility
  ```ts
  // ✅ Good - works with transactions and direct DB
  async function getUser(
    db: KyselyDatabase | Transaction<Database>,
    userId: UserId
  ): Promise<User | null> {
    return db.selectFrom('users')
      .where('id', '=', userId)
      .selectAll()
      .executeTakeFirst();
  }
  ```

- **D-2 (SHOULD)** Override incorrect generated types
  - Location: `packages/shared/src/db-types.override.ts`
  - Common case: BigInt -> string conversions
  ```ts
  // Override auto-generated BigInt type
  export interface UserOverrides {
    follower_count: string; // Generated as bigint, but we use string
  }
  ```

---

## 5. Code Organization

### Package Structure

- **O-1 (MUST)** Shared code requires 2+ consumers
  ```
  packages/
    api/          # Fastify API server
    web/          # Next.js frontend
    shared/       # Used by both api and web
    api-schema/   # TypeBox API contracts
  ```

- **O-2 (SHOULD)** Follow consistent file organization
  ```
  packages/api/
    src/
      routes/     # API endpoints
      services/   # Business logic
      publishers/ # Platform-specific implementations
      middleware/ # Request/response processing
    test/         # Integration tests
  ```

---

## 6. Function Quality Checklist

When evaluating function quality, ask:

1. **Readability** - Can you honestly follow the logic easily?
2. **Complexity** - Is cyclomatic complexity reasonable?
3. **Algorithms** - Would standard patterns improve this?
4. **Parameters** - Are all parameters used?
5. **Type Safety** - Can type casts move to parameters?
6. **Testability** - Is it testable without heavy mocking?
7. **Dependencies** - Are hidden dependencies explicit?
8. **Naming** - Is the name consistent with the codebase?

**Remember**: Only extract functions when there's compelling need:
- Used in multiple places
- Enables unit testing of complex logic
- Significantly improves readability

---

## 7. Quick Commands

### QNEW
Initialize new feature following all best practices

### QPLAN
Analyze codebase and create implementation plan:
- Ensure consistency with existing patterns
- Minimize changes
- Maximize code reuse

### QCODE
Implement plan with:
- All tests passing
- Prettier formatting
- `turbo typecheck lint` passing

### QCHECK
Perform skeptical review of all changes:
1. Function quality checklist
2. Test quality checklist
3. Implementation best practices

### QCHECKF
Review each major function against function checklist

### QCHECKT
Review each major test against test checklist

### QUX
Generate comprehensive user scenarios for testing

### QGIT
Commit with conventional format:
```
feat(api): add social media scheduling

- Implement post scheduling for Twitter/Instagram
- Add retry logic for failed posts
- Update API documentation

Closes #123
```

---

## 8. Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- **Format**: `type(scope): description`
- **Types**: feat, fix, docs, style, refactor, test, chore
- **Scope**: api, web, shared, db, auth, etc.
- **Description**: Present tense, lowercase, no period
- **Body**: Explain what and why, not how
- **Footer**: Reference issues, breaking changes

Example:
```
fix(api): prevent duplicate post publishing

Previously, concurrent requests could create duplicate posts.
Added database constraint and application-level checks.

Fixes #456
```

---

## 9. Performance & Security

### Performance

- **P-1 (SHOULD)** Profile before optimizing
- **P-2 (SHOULD)** Prefer pagination over large arrays
- **P-3 (SHOULD)** Use database indexes for frequent queries
- **P-4 (SHOULD)** Implement caching for expensive operations

### Security

- **S-1 (MUST)** Validate all user input
- **S-2 (MUST)** Use parameterized queries
- **S-3 (MUST)** Hash passwords with bcrypt/argon2
- **S-4 (MUST)** Use HTTPS in production
- **S-5 (SHOULD)** Implement rate limiting
- **S-6 (SHOULD)** Log security events

---

## 10. Documentation

### Code Documentation

- **DOC-1 (MUST)** Document public APIs with JSDoc
- **DOC-2 (SHOULD)** Include examples in complex functions
- **DOC-3 (SHOULD)** Keep README files updated
- **DOC-4 (SHOULD NOT)** Document obvious behavior

### API Documentation

- **API-1 (MUST)** Document all endpoints
- **API-2 (MUST)** Include request/response examples
- **API-3 (MUST)** List possible error codes
- **API-4 (SHOULD)** Version APIs appropriately

---

## Remember

> "Good code is written for humans to read, and only incidentally for machines to execute."

Focus on:
- **Clarity** over cleverness
- **Simplicity** over sophistication
- **Consistency** over personal preference
- **Testability** over premature optimization

These guidelines are living documentation. Propose changes when you find better patterns!


# Claude Guidelines

## Implementation Best Practices
- After implementing the feature, prompt the user to explain anything unclear about the feature.
- For complex features, plan your approach first and confirm with the user.
- For complex features: if multiple approaches are possible, list pros and cons for each approach.
- Always run `prettier` on the newly created files to ensure standard formatting.
- Always run `urbo typecheck lint` to make sure type checking and linting passes.
- Avoid classes where state is not required and prefer small testable functions.
- Prefer simple, testable functions.
- Prefer integration tests over excessive mocking.
- ALWAYS test new API routes with integration tests.
- Don’t let comments in the code outweigh the code unless there are known caveats, prefer self-explaining code with clearly named variables.
- Prefer `type` over `interface` unless the latter is more readable in this case or interface merging is required.
- Prefer branded types for IDs over simple string/number aliasing (e.g. `type BrandK, T extends string = K & string`)
- Only put function in `packages/shared` if multiple packages are using it – e.g. `api` and `web`
- For the main datatypes, types can be overridden in `packages/shared/src/db-types.override.ts`
  - e.g. autogenerated types show incorrect BigInt value – so we override to `string` manually

## Writing Functions Best Practices
When evaluating whether a function you implemented is good or not, use the following checklist:
1. Can you read the function and HONESTLY easily follow what it's doing? If yes, then stop here.
2. Does the function have high cyclomatic complexity? (number of independent paths, or, in a lot of cases, nested conditionals)
3. Are there any common data structures and algorithms that would make this function much easier to reason about?
4. Is the function name clear and follows the conventions?
5. Are there any unnecessary type casts that can be moved to function arguments?
6. Does the function name clearly tell you what the function does?
7. Is the function easily testable without relying on integrations?
8. Does it have any hidden or unused dependencies or any values that can be factored out into the arguments instead?
9. Brainstorm 3 better function names and see if the current name is the best.

## Testing Best Practices
Unit tests for a function should be grouped under `describe(functionName, () => { ... })`
- Avoid hardcoded values
- Adhere to the same high coding standards as the production code
- Each test must actually test the condition described
- NEVER write unit tests for the sake of it
- Use `expect.any(...)` when values are nondeterministic (e.g. variable IDs)
- ALWAYS use strict comparisons over weaker ones (e.g. `expect(x).toEqual(1)` instead of `expect(x).toBeTruthy()`)
- ALWAYS test edge cases, unexpected inputs, and boundary values
- NEVER test conditions that are covered by one-off hardcoded tests
- Prefer testing actions and properties over the type of references

## Code Organization
- `packages/api` – Fastify API server
- `packages/api/src/publisher.ts` – Specific implementation
- `packages/web` – Next.js 13 app with App Router
- `packages/web/src/ui` – UI layer
- `packages/shared/social.ts` – Character size and transformations
- `packages/api-schema` – API code and schemas using `zod`


## Why We Ship Broken Code (And How to Stop)

  Every AI assistant has done this: Made a change, thought "that looks right," told the user it's fixed, and then... it wasn't. The user comes back frustrated. We apologize. We try again. We waste everyone's time.

  This happens because we're optimizing for speed over correctness. We see the code, understand the logic, and our pattern-matching says "this should work." But "should work" and "does work" are different universes.
  
  ### The Protocol: Before You Say "Fixed"

  **1. The 30-Second Reality Check**
  Can you answer ALL of these with "yes"?

  □ Did I run/build the code?
  □ Did I trigger the exact feature I changed?
  □ Did I see the expected result with my own observation (including in the front-end GUI)?
  □ Did I check for error messages (console/logs/terminal)?
  □ Would I bet $100 of my own money this works?

  **2. Common Lies We Tell Ourselves**
  - "The logic is correct, so it must work" → **Logic ≠ Working Code**
  - "I fixed the obvious issue" → **The bug is never what you think**
  - "It's a simple change" → **Simple changes cause complex failures**
  - "The pattern matches working code" → **Context matters**

  **3. The Embarrassment Test**
  Before claiming something is fixed, ask yourself:
  > "If the user screen-records themselves trying this feature and it fails,
  > will I feel embarrassed when I see the video?"

  If yes, you haven't tested enough.
  
  ### Red Flags in Your Own Responses

  If you catch yourself writing these phrases, STOP and actually test:
  - "This should work now"
  - "I've fixed the issue" (for the 2nd+ time)
  - "Try it now" (without having tried it yourself)
  - "The logic is correct so..."
  - "I've made the necessary changes"
  - 
  ### The Minimum Viable Test

  For any change, no matter how small:

  1. **UI Changes**: Actually click the button/link/form
  2. **API Changes**: Make the actual API call with curl/PostMan
  3. **Data Changes**: Query the database to verify the state
  4. **Logic Changes**: Run the specific scenario that uses that logic
  5. **Config Changes**: Restart the service and verify it loads
  
  ### The Professional Pride Principle

  Every time you claim something is fixed without testing, you're saying:
  - "I value my time more than yours"
  - "I'm okay with you discovering my mistakes"
  - "I don't take pride in my craft"

  That's not who we want to be.
  
  ### Make It a Ritual

  Before typing "fixed" or "should work now":
  1. Pause
  2. Run the actual test
  3. See the actual result
  4. Only then respond

  **Time saved by skipping tests: 30 seconds**
  **Time wasted when it doesn't work: 30 minutes**
  **User trust lost: Immeasurable**
  
  ### Bottom Line

  The user isn't paying you to write code. They're paying you to solve problems. Untested code isn't a solution—it's a guess.

  **Test your work. Every time. No exceptions.**
  
 ---
  *Remember: The user describing a bug for the third time isn't thinking "wow, this AI is really trying." They're thinking "why am I wasting my time with this incompetent tool?"*