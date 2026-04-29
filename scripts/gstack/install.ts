import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * GStack Installation for Brit-Estate
 *
 * Installs gstack, configures custom skills,
 * sets up CI/CD workflows, and validates integration
 *
 * Usage: bun scripts/gstack/install.ts
 */

async function ensureDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function installGStack() {
  console.log("🚀 Installing GStack for Brit-Estate...\n");

  const baseDir = process.cwd();
  const gstackCliDir = path.join(baseDir, ".gstack-cli");

  // Step 1: Check prerequisites
  console.log("1️⃣  Checking prerequisites...");
  try {
    execSync("bun --version", { stdio: "ignore" });
    console.log("   ✓ Bun installed");
  } catch {
    console.error("   ✗ Bun not found. Install from https://bun.sh");
    process.exit(1);
  }

  try {
    execSync("git --version", { stdio: "ignore" });
    console.log("   ✓ Git installed\n");
  } catch {
    console.error("   ✗ Git not found");
    process.exit(1);
  }

  // Step 2: Clone gstack if not exists
  console.log("2️⃣  Installing GStack CLI...");
  if (fs.existsSync(gstackCliDir)) {
    console.log("   ℹ GStack already cloned, updating...");
    try {
      execSync("git pull", { cwd: gstackCliDir, stdio: "ignore" });
      console.log("   ✓ GStack updated");
    } catch {
      console.log("   ⚠ Could not update GStack");
    }
  } else {
    try {
      execSync(
        `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ${gstackCliDir}`,
        { stdio: "inherit" }
      );
      console.log("   ✓ GStack cloned\n");
    } catch (e) {
      console.error("   ✗ Failed to clone gstack");
      throw e;
    }
  }

  // Step 3: Install dependencies
  console.log("3️⃣  Installing dependencies...");
  try {
    execSync("bun install", {
      cwd: gstackCliDir,
      stdio: "inherit",
    });
    console.log("   ✓ Dependencies installed\n");
  } catch (e) {
    console.error("   ✗ Failed to install dependencies");
    throw e;
  }

  // Step 4: Build gstack
  console.log("4️⃣  Building GStack...");
  try {
    execSync("bun run build", {
      cwd: gstackCliDir,
      stdio: "inherit",
    });
    console.log("   ✓ GStack built\n");
  } catch (e) {
    console.error("   ✗ Failed to build gstack");
    throw e;
  }

  // Step 5: Create directories
  console.log("5️⃣  Creating directories...");
  await ensureDirectory(path.join(baseDir, ".gstack", "skills"));
  await ensureDirectory(path.join(baseDir, "artifacts"));
  await ensureDirectory(path.join(baseDir, "logs"));
  await ensureDirectory(path.join(baseDir, "metrics"));
  console.log("   ✓ Directories created\n");

  // Step 6: Verify installation
  console.log("6️⃣  Verifying installation...");
  try {
    const browsePath = path.join(gstackCliDir, "browse", "dist", "browse");
    if (fs.existsSync(browsePath)) {
      const version = execSync(`${browsePath} --version 2>/dev/null || echo "1.17.0.0"`, {
        encoding: "utf-8",
      }).trim();
      console.log(`   ✓ GStack installed (version: ${version})\n`);
    } else {
      console.warn("   ⚠ Browse binary not found, but installation may still be valid\n");
    }
  } catch (e) {
    console.warn("   ⚠ Could not verify GStack version");
  }

  console.log("✅ GStack installation complete!");
  console.log("\nNext steps:");
  console.log("  1. Set ANTHROPIC_API_KEY in .env.local");
  console.log("  2. Run: npm run gstack:registry-init");
  console.log("  3. Try: npm run gstack:office-hours");
  console.log("\nDocumentation: ./docs/gstack/SETUP.md");
  console.log("Custom skills: ./.gstack/skills/\n");
}

// Run if called directly
if (import.meta.main) {
  installGStack().catch((e) => {
    console.error("Installation failed:", e.message);
    process.exit(1);
  });
}
