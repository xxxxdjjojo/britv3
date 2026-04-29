import { describe, it, expect, beforeAll } from "bun:test";
import fs from "fs";
import path from "path";

/**
 * GStack Integration Tests
 *
 * Tests:
 * - Skill registry loads correctly
 * - Skill definitions are valid
 * - Configuration files exist
 * - Custom skills are accessible
 */

describe("GStack Integration", () => {
  const gstackDir = ".gstack";
  const skillsDir = path.join(gstackDir, "skills");

  describe("Directory Structure", () => {
    it("should have .gstack directory", () => {
      expect(fs.existsSync(gstackDir)).toBe(true);
    });

    it("should have skills directory", () => {
      expect(fs.existsSync(skillsDir)).toBe(true);
    });

    it("should have config.yaml", () => {
      expect(fs.existsSync(path.join(gstackDir, "config.yaml"))).toBe(true);
    });
  });

  describe("Skill Files", () => {
    const expectedSkills = [
      "audit-listings.skill.md",
      "test-mls-sync.skill.md",
      "valuation-checker.skill.md",
      "landlord-report.skill.md",
      "qa-marketplace.skill.md",
      "release-notes.skill.md",
    ];

    for (const skill of expectedSkills) {
      it(`should have ${skill} defined`, () => {
        const skillPath = path.join(skillsDir, skill);
        expect(fs.existsSync(skillPath)).toBe(true);
      });

      it(`should have valid content in ${skill}`, () => {
        const skillPath = path.join(skillsDir, skill);
        const content = fs.readFileSync(skillPath, "utf-8");

        expect(content).toContain("# ");  // Has heading
        expect(content).toContain("Role");
        expect(content).toContain("Purpose");
        expect(content.length).toBeGreaterThan(500);
      });
    }
  });

  describe("Configuration", () => {
    it("should load config.yaml", () => {
      const configPath = path.join(gstackDir, "config.yaml");
      const content = fs.readFileSync(configPath, "utf-8");

      expect(content).toContain("brit-estate");
      expect(content).toContain("version:");
    });

    it("should have valid YAML structure", () => {
      const configPath = path.join(gstackDir, "config.yaml");
      const content = fs.readFileSync(configPath, "utf-8");

      // Check for key sections
      expect(content).toContain("features:");
      expect(content).toContain("integrations:");
      expect(content).toContain("realestate:");
    });
  });

  describe("Skill Registry", () => {
    it("should import and initialize registry", async () => {
      const { skillRegistry } = await import("../../scripts/gstack/skill-registry");
      await skillRegistry.initialize();
      const skills = await skillRegistry.listSkills();

      expect(skills.length).toBe(6);
    });

    it("should have all expected skills", async () => {
      const { skillRegistry } = await import("../../scripts/gstack/skill-registry");
      await skillRegistry.initialize();
      const skills = await skillRegistry.listSkills();
      const names = skills.map((s) => s.name);

      expect(names).toContain("audit-listings");
      expect(names).toContain("test-mls-sync");
      expect(names).toContain("valuation-checker");
      expect(names).toContain("landlord-report");
      expect(names).toContain("qa-marketplace");
      expect(names).toContain("release-notes");
    });

    it("should validate all skills", async () => {
      const { skillRegistry } = await import("../../scripts/gstack/skill-registry");
      await skillRegistry.initialize();
      const valid = await skillRegistry.validateSkills();

      expect(valid).toBe(true);
    });
  });

  describe("Skill Properties", () => {
    it("should have valid properties for each skill", async () => {
      const { skillRegistry } = await import("../../scripts/gstack/skill-registry");
      await skillRegistry.initialize();
      const skills = await skillRegistry.listSkills();

      for (const skill of skills) {
        expect(skill.name).toBeTruthy();
        expect(skill.path).toBeTruthy();
        expect(skill.purpose).toBeTruthy();
        expect(skill.roles.length).toBeGreaterThan(0);
        expect(skill.triggers.length).toBeGreaterThan(0);
        expect(skill.timeout).toBeGreaterThan(0);
        expect(skill.dependencies.length).toBeGreaterThan(0);
      }
    });
  });
});
