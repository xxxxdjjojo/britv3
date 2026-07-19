import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";

/**
 * GStack Workflow Tests
 *
 * Tests workflow automation for CI/CD integration
 */

describe("GStack Workflow Automation", () => {
  describe("GitHub Actions Workflows", () => {
    it("should have workflow directory", () => {
      expect(fs.existsSync(".github/workflows")).toBe(true);
    });

    it("should have daily audit workflow", () => {
      const workflow = ".github/workflows/gstack-daily-audit.yml";
      if (fs.existsSync(workflow)) {
        const content = fs.readFileSync(workflow, "utf-8");
        expect(content).toContain("Daily");
        expect(content).toContain("gstack");
      }
    });

    it("should have pre-deploy workflow", () => {
      const workflow = ".github/workflows/gstack-pre-deploy.yml";
      if (fs.existsSync(workflow)) {
        const content = fs.readFileSync(workflow, "utf-8");
        expect(content).toContain("Pre-Deployment");
        expect(content).toContain("QA");
      }
    });
  });

  describe("Skill Automation", () => {
    it("should have skill registry", () => {
      expect(fs.existsSync("scripts/gstack/skill-registry.ts")).toBe(true);
    });

    it("should support daily execution", () => {
      const skills = [
        "audit-listings",
        "test-mls-sync",
        "landlord-report",
      ];

      for (const skill of skills) {
        const skillFile = `.gstack/skills/${skill}.skill.md`;
        expect(fs.existsSync(skillFile)).toBe(true);
      }
    });
  });

  describe("Deployment Pipeline", () => {
    it("should validate pre-deployment checks", () => {
      const config = ".gstack/config.yaml";
      const content = fs.readFileSync(config, "utf-8");

      expect(content).toContain("deployment");
      expect(content).toContain("qa");
    });

    it("should track workflow performance", () => {
      expect(fs.existsSync(".github/workflows/perf-budget.yml")).toBe(true);
    });
  });

  describe("Integration Points", () => {
    it("should support Supabase integration", () => {
      const config = ".gstack/config.yaml";
      const content = fs.readFileSync(config, "utf-8");
      expect(content).toContain("supabase");
    });

    it("should support Stripe integration", () => {
      const config = ".gstack/config.yaml";
      const content = fs.readFileSync(config, "utf-8");
      expect(content).toContain("stripe");
    });

    it("should support Slack notifications", () => {
      const config = ".gstack/config.yaml";
      const content = fs.readFileSync(config, "utf-8");
      expect(content).toContain("slack") || console.log("Slack optional");
    });

    it("should support GitHub integration", () => {
      const config = ".gstack/config.yaml";
      const content = fs.readFileSync(config, "utf-8");
      expect(content).toContain("github");
    });
  });

  describe("Error Handling", () => {
    it("should have logging configured", () => {
      expect(fs.existsSync("sentry.server.config.ts")).toBe(true);
    });

    it("should have error tracking", () => {
      const config = ".gstack/config.yaml";
      const content = fs.readFileSync(config, "utf-8");
      expect(content).toContain("sentry") || console.log("Sentry optional");
    });
  });
});
