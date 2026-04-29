# GStack Setup Guide for Brit-Estate

## Prerequisites

- **Node.js 18+**
- **Bun 1.0+** — [Install from https://bun.sh](https://bun.sh)
- **Git** — [Install from https://git-scm.com](https://git-scm.com)
- **Claude Code API key** — [Get from Anthropic](https://console.anthropic.com)

## Installation (5 minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/xxxxdjjojo/britv3.git
cd britv3
```

### Step 2: Install Dependencies

```bash
pnpm install
# (or npm install if you prefer npm)
```

### Step 3: Install GStack

```bash
bun scripts/gstack/install.ts
```

This will:
- Clone GStack CLI to `.gstack-cli/`
- Install all dependencies
- Build the GStack binaries
- Create necessary directories
- Validate installation

### Step 4: Configure Environment

Create `.env.local` with required variables:

```bash
# Required for GStack
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Optional: GitHub integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx

# Optional: Slack notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/xxxxx/xxxxx/xxxxx
```

### Step 5: Initialize Skill Registry

```bash
bun scripts/gstack/skill-registry.ts
```

Expected output:
```
📚 Initializing Brit-Estate Skill Registry...

   ✓ audit-listings       — Audit property listings for quality and compliance
   ✓ test-mls-sync        — Test property synchronization from external sources
   ✓ valuation-checker    — Validate AI-generated property valuations
   ✓ landlord-report      — Generate automated landlord portfolio reports
   ✓ qa-marketplace       — Automated marketplace QA and testing
   ✓ release-notes        — Auto-generate release notes from commits

✅ Skill registry initialized with 6 custom skills
```

### Step 6: Verify Installation

```bash
# Check if all tests pass
pnpm test test/gstack/integration.test.ts
```

Expected output:
```
✓ GStack Integration
  ✓ Directory Structure
  ✓ Skill Files
  ✓ Configuration
  ✓ Skill Registry
```

✅ **Installation complete!**

## Usage

### Running Custom Skills

Skills are invoked through Claude Code (the interface Garry uses). If you're using gstack standalone:

#### Example: Audit Listings

```bash
# Review all listings
bun .gstack-cli/browse/dist/browse /audit-listings

# Or via npm script
npm run gstack:audit-listings
```

#### Example: Generate Release Notes

```bash
# Generate notes from v1.0.0 to v1.1.0
npm run gstack:release-notes -- --from=v1.0.0 --to=v1.1.0
```

#### Example: QA Marketplace

```bash
# Run marketplace tests on staging
npm run gstack:qa-marketplace -- --url=https://staging.britstate.co.uk
```

### Using in Claude Code

1. Open Claude Code
2. Copy this prompt:

```
I'm building Brit-Estate, a UK property portal. Here's the project:
- Repository: https://github.com/xxxxdjjojo/britv3
- Architecture: Next.js 16 + Supabase + Stripe
- I have 6 custom GStack skills for automation

/office-hours

Describe any feature or bug you're working on. The CEO agent will review it strategically.
```

3. The gstack skills will be available via:
   - `/audit-listings` — Check listing quality
   - `/test-mls-sync` — Validate data sync
   - `/qa-marketplace` — Test features
   - `/landlord-report` — Generate reports
   - `/valuation-checker` — Verify valuations
   - `/release-notes` — Generate release docs

## Troubleshooting

### GStack Not Found

```bash
# Check if .gstack-cli exists
ls -la .gstack-cli/

# If missing, reinstall
rm -rf .gstack-cli
bun scripts/gstack/install.ts
```

### Claude Code Not Responding

1. Check API key:
```bash
echo $ANTHROPIC_API_KEY
```

2. Verify format (should start with `sk-ant-`):
```bash
if [[ $ANTHROPIC_API_KEY == sk-ant-* ]]; then echo "OK"; else echo "INVALID"; fi
```

### Skills Not Loading

```bash
# Validate all skills
bun scripts/gstack/skill-registry.ts --validate

# Should output:
# ✓ audit-listings                 — 3.4 KB
# ✓ test-mls-sync                  — 2.6 KB
# ... etc
```

### Bun Not Found

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or ~/.zshrc for macOS
bun --version
```

## Performance Tips

- **Skills run in parallel** when possible (e.g., audit multiple listings)
- **Large operations timeout** at 20 minutes (configurable in `.gstack/config.yaml`)
- **Results cached** in `./artifacts/`
- **Logs available** in `./logs/`
- **Metrics tracked** in `./metrics/`

## Custom Skills Reference

| Skill | Purpose | Timeout | Role |
|-------|---------|---------|------|
| `audit-listings` | Quality & compliance audit | 600s | QA, Architect |
| `test-mls-sync` | Data sync validation | 900s | Architect, QA |
| `valuation-checker` | Valuation accuracy check | 300s | QA, Architect |
| `landlord-report` | Portfolio report generation | 600s | Release, QA |
| `qa-marketplace` | Feature testing | 1200s | QA |
| `release-notes` | Release note generation | 300s | Release |

## Integration with CI/CD

### GitHub Actions Example

Add `.github/workflows/gstack-qa.yml`:

```yaml
name: GStack QA
on:
  pull_request:
    branches: [main]

jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install Dependencies
        run: bun install
        
      - name: Run GStack Tests
        run: bun test test/gstack/
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Next Steps

1. **Read the skills documentation**: `./docs/gstack/SKILLS.md`
2. **Review the examples**: `./docs/gstack/EXAMPLES.md`
3. **Try your first skill**: `npm run gstack:audit-listings`
4. **Integrate with CI/CD**: Set up automated testing
5. **Extend skills**: Create your own in `.gstack/skills/`

## Support

- 📖 GStack docs: https://github.com/garrytan/gstack
- 🐛 Report issues: https://github.com/garrytan/gstack/issues
- 💬 Questions: Check gstack README
- 📚 This project: See `.gstack/skills-registry.json` for all custom skills

---

**Happy building! 🚀**
