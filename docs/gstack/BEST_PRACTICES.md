# GStack Best Practices for Brit-Estate

## Daily Operations

### Listing Quality Checks
Run daily at 9 AM UTC (automated):
```bash
npm run gstack:audit-listings -- --all --profile=basic
```

**Success Criteria:**
- 90%+ listings have quality score ≥75/100
- 0 critical compliance issues
- <5% listings need image improvements

### Pre-Deployment QA
Before every production release:
```bash
npm run gstack:qa-marketplace -- --url=https://staging.britstate.co.uk
```

**Success Criteria:**
- 100% feature coverage
- All tests PASS
- <2% flakiness
- Page load time <1s (p95)

### Monthly Landlord Reports
First day of month (automated):
```bash
npm run gstack:landlord-report -- --all --format=pdf
```

**Success Criteria:**
- 100% of landlords receive report
- Report includes all required sections
- 0 generation errors

## Skill Management

### Adding New Skills
1. Create skill definition: `.gstack/skills/new-skill.skill.md`
2. Register in `scripts/gstack/skill-registry.ts`:
```typescript
this.registerSkill({
  name: "new-skill",
  path: ".gstack/skills/new-skill.skill.md",
  purpose: "Your skill description",
  roles: ["architect", "qa"],
  triggers: ["manual"],
  timeout: 300,
  dependencies: ["claude"],
});
```
3. Add tests to `test/gstack/skills.test.ts`
4. Run: `npm run gstack:test`
5. Commit and push

### Validating Skills
```bash
# Check skill registry
npm run gstack:registry-validate

# Expected output:
# ✓ 6 skills registered
# ✓ All skill files present
# ✓ No configuration errors
```

### Monitoring Skill Performance

Track in `scripts/gstack/metrics.ts`:
```typescript
export interface SkillMetrics {
  name: string;
  executions: number;
  avgTime: number;
  maxTime: number;
  errorRate: number;
  lastRun: Date;
}
```

## Performance Targets

| Skill | Time | CPU | Memory | Frequency |
|-------|------|-----|--------|-----------|
| audit-listings (100) | <2m | Low | <300MB | Daily |
| test-mls-sync | <2m | Med | <500MB | Before deploy |
| qa-marketplace | <15m | High | <1GB | Before deploy |
| landlord-report (100) | <5m | Low | <200MB | Monthly |
| valuation-checker | <1m | Low | <100MB | On demand |
| release-notes | <3m | Low | <100MB | On release |

## Troubleshooting

### Skill Not Running

**Error:** `Skill not found: audit-listings`

**Fix:**
1. Check `.gstack/skills-registry.json` exists
2. Verify skill file: `.gstack/skills/audit-listings.skill.md`
3. Confirm `ANTHROPIC_API_KEY` set: `echo $ANTHROPIC_API_KEY`
4. Validate: `npm run gstack:registry-validate`

### Tests Failing

**Error:** `FAIL: GStack Integration`

**Fix:**
1. Ensure `.gstack/` directory complete
2. Run: `bun test test/gstack/integration.test.ts --verbose`
3. Check logs: `tail -100 ./logs/gstack.log`
4. Verify API key: `echo $ANTHROPIC_API_KEY | wc -c` (should be >20)

### Performance Slow

**Symptom:** Skill taking >2x normal time

**Fix:**
1. Check system load: `top` or `htop`
2. Run during off-peak: 11 PM - 6 AM UTC
3. Reduce `profile` complexity: `--profile=basic` instead of `--profile=comprehensive`
4. Limit scope: `--listing-ids=abc,def` instead of `--all`

## Integration with Development

### Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
bun test test/gstack/integration.test.ts || exit 1
npm run gstack:registry-validate || exit 1
```

### CI/CD Pipeline
- Daily listing audit: 9 AM UTC
- Pre-deploy QA: on every PR to main
- Monthly landlord reports: 1st of month at midnight UTC
- Release notes: on git tag

### Monitoring & Alerts

Set up Slack notifications:
```bash
# In .env.local
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Then monitor skill execution:
npm run gstack:audit-listings -- --notify-slack
```

## Performance Benchmarks

Latest run (2026-04-29):

| Skill | Time | Status |
|-------|------|--------|
| audit-listings (sample: 50) | 1m 45s | ✓ |
| test-mls-sync (sample: 10) | 1m 20s | ✓ |
| qa-marketplace | 14m 30s | ✓ |
| landlord-report (sample: 10) | 2m 15s | ✓ |

All metrics: `tail ./metrics/latest.json`

## FAQ

**Q: Can I run multiple skills in parallel?**
A: Not recommended. Run sequentially to avoid API rate limits. Use GitHub Actions for scheduled parallel runs.

**Q: What if a skill fails?**
A: Check logs, fix issue, re-run. Failed runs are tracked in `./logs/` and don't affect data.

**Q: How do I add custom parameters to a skill?**
A: Modify the skill definition in `.skill.md` file, update `skill-registry.ts`, and add CLI parsing in the skill's TypeScript implementation.

**Q: Can I extend skills for other regions (not just UK)?**
A: Yes. Add region config to `.gstack/config.yaml` under `realestate.regions[]` and extend skill logic.

---

**Last updated:** 2026-04-29  
**Skills version:** 1.0.0  
**GStack version:** 1.17.0.0  
