import fs from "fs";
import path from "path";

/**
 * GStack Skill Registry for Brit-Estate
 *
 * Manages custom skills, tracks usage, validates skill definitions
 */

export interface SkillDefinition {
  name: string;
  path: string;
  purpose: string;
  roles: string[];
  triggers: string[];
  timeout: number;
  dependencies: string[];
  testFile?: string;
}

export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();
  private registryPath = ".gstack/skills-registry.json";

  async initialize() {
    console.log("\n📚 Initializing Brit-Estate Skill Registry...\n");

    this.registerSkill({
      name: "audit-listings",
      path: ".gstack/skills/audit-listings.skill.md",
      purpose: "Audit property listings for quality and compliance",
      roles: ["qa", "architect"],
      triggers: ["manual", "daily-cron", "on-listing-created"],
      timeout: 600,
      dependencies: ["browse", "claude"],
      testFile: "test/gstack/skills.test.ts",
    });

    this.registerSkill({
      name: "test-mls-sync",
      path: ".gstack/skills/test-mls-sync.skill.md",
      purpose: "Test property synchronization from external sources",
      roles: ["architect", "qa"],
      triggers: ["manual", "before-deployment"],
      timeout: 900,
      dependencies: ["browse", "claude"],
      testFile: "test/gstack/skills.test.ts",
    });

    this.registerSkill({
      name: "valuation-checker",
      path: ".gstack/skills/valuation-checker.skill.md",
      purpose: "Validate AI-generated property valuations",
      roles: ["qa", "architect"],
      triggers: ["manual", "on-valuation-generated"],
      timeout: 300,
      dependencies: ["claude"],
      testFile: "test/gstack/skills.test.ts",
    });

    this.registerSkill({
      name: "landlord-report",
      path: ".gstack/skills/landlord-report.skill.md",
      purpose: "Generate automated landlord portfolio reports",
      roles: ["release", "qa"],
      triggers: ["monthly-cron", "manual", "on-month-end"],
      timeout: 600,
      dependencies: ["claude"],
      testFile: "test/gstack/skills.test.ts",
    });

    this.registerSkill({
      name: "qa-marketplace",
      path: ".gstack/skills/qa-marketplace.skill.md",
      purpose: "Automated marketplace QA and testing",
      roles: ["qa"],
      triggers: ["before-deployment", "manual"],
      timeout: 1200,
      dependencies: ["browse", "claude"],
      testFile: "test/gstack/skills.test.ts",
    });

    this.registerSkill({
      name: "release-notes",
      path: ".gstack/skills/release-notes.skill.md",
      purpose: "Auto-generate release notes from commits",
      roles: ["release"],
      triggers: ["on-tag-pushed", "manual"],
      timeout: 300,
      dependencies: ["claude"],
      testFile: "test/gstack/skills.test.ts",
    });

    this.saveRegistry();
    console.log("✅ Skill registry initialized with 6 custom skills\n");
  }

  private registerSkill(skill: SkillDefinition) {
    this.skills.set(skill.name, skill);
    console.log(`   ✓ ${skill.name.padEnd(20)} — ${skill.purpose}`);
  }

  private saveRegistry() {
    const registry = Array.from(this.skills.values());
    fs.writeFileSync(this.registryPath, JSON.stringify(registry, null, 2));
  }

  async listSkills() {
    return Array.from(this.skills.values());
  }

  async getSkill(name: string): Promise<SkillDefinition | undefined> {
    return this.skills.get(name);
  }

  async validateSkills() {
    console.log("\n✔ Validating skills...\n");
    let valid = 0;
    let invalid = 0;

    for (const [name, skill] of this.skills) {
      const exists = fs.existsSync(skill.path);
      if (exists) {
        const size = fs.statSync(skill.path).size;
        console.log(`   ✓ ${name.padEnd(20)} — ${(size / 1024).toFixed(1)} KB`);
        valid++;
      } else {
        console.log(`   ✗ ${name.padEnd(20)} — File not found: ${skill.path}`);
        invalid++;
      }
    }

    console.log(`\n${valid} valid, ${invalid} invalid\n`);
    return invalid === 0;
  }

  async describeSkills() {
    console.log("\n📋 Custom Skills Summary\n");
    for (const skill of this.skills.values()) {
      console.log(`${skill.name}`);
      console.log(`  Purpose: ${skill.purpose}`);
      console.log(`  Roles: ${skill.roles.join(", ")}`);
      console.log(`  Timeout: ${skill.timeout}s`);
      console.log();
    }
  }
}

// Export registry instance
export const skillRegistry = new SkillRegistry();

// CLI: Run if called directly
if (import.meta.main) {
  const registry = new SkillRegistry();
  await registry.initialize();
  await registry.validateSkills();
  await registry.describeSkills();
}
