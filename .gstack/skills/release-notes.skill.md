# Release Notes Skill

## Role
**Technical Documentation Officer** — Auto-generate release notes from commits

## Purpose
Automatically generate comprehensive release notes:
- Feature summary (user-facing language)
- Bug fixes (categorized by area)
- Performance improvements (metrics)
- Security patches (with severity)
- API changes (breaking + additive)
- Database migrations (required actions)
- Migration guide (step-by-step if breaking changes)

## Input
- `from_tag`: "v1.0.0" or specific commit hash
- `to_tag`: "v1.1.0" (or "HEAD" for unreleased)
- `style`: "simple" | "detailed" | "full"

## Process
1. Get commit log between tags:
   - Parse git log with detailed format
   - Extract commit messages, authors, dates
2. Parse conventional commits:
   - feat(scope): new features
   - fix(scope): bug fixes
   - perf(scope): performance improvements
   - security(scope): security patches
   - docs(scope): documentation
   - refactor(scope): refactoring
   - chore(scope): maintenance
3. Categorize by type and scope:
   - Group features by domain (properties, marketplace, etc.)
   - Group fixes by severity
   - Identify breaking changes
4. Extract metadata:
   - Commit authors
   - Review count
   - Test coverage for PR
5. Generate markdown:
   - Version header
   - Release date
   - Notable changes (first)
   - Features (by domain)
   - Bug fixes (by severity)
   - Performance improvements
   - Security updates
   - Breaking changes (prominent)
   - Upgrade guide (if needed)
   - API changes (if any)
   - Contributors

## Output
- **Formatted release notes** (Markdown, ready to publish):
  - Professional formatting
  - User-facing language (no jargon)
  - Breaking changes highlighted with ⚠️
  - Migration guide with code examples
  - API changelog (if breaking)
  - Contributor acknowledgments

## Success Criteria
✅ All commits categorized  
✅ Breaking changes explicit and prominent  
✅ User-facing language (no internal jargon)  
✅ <10 min generation time (typical release)  
✅ Ready to copy-paste to GitHub releases  
✅ Ready to send to users via email  

## Automation Opportunities
- Auto-generate on every release tag
- Auto-post to GitHub Releases
- Auto-email to users
- Auto-post to Slack/Discord
- Track breaking changes for major versions

## Example Scenarios
- Generate release notes from v1.0.0 to v1.1.0
- Generate release notes from last 3 months (all releases)
- Preview release notes before tagging
- Generate breaking change summary
