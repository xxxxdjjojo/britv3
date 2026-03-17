import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("verify email page renders", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.getByText("Check your email")).toBeVisible();
  });

  test("reset password page renders", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: /new password/i })).toBeVisible();
  });

  test("welcome page renders", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome to Britestate");
    await expect(page.getByRole("link", { name: /Start Searching/i })).toHaveAttribute("href", "/search");
  });
});

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome back");
  });

  test("has email and password fields", async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("has link to register", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/register");
  });

  test("has OAuth buttons", async ({ page }) => {
    await expect(page.getByText(/continue with email/i)).toBeVisible();
  });
});

test.describe("Register Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Create your account");
  });

  test("has link to login", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
  });
});

test.describe("Forgot Password Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("renders with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Reset your password");
  });

  test("has email input", async ({ page }) => {
    await expect(page.getByText(/enter your email/i)).toBeVisible();
  });

  test("has back to login link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /back to login/i })).toBeVisible();
  });
});

test.describe("Two-Factor Setup Page", () => {
  test("renders with heading", async ({ page }) => {
    await page.goto("/two-factor-setup");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Set up two-factor authentication");
  });
});

test.describe("Two-Factor Verification Page", () => {
  test("renders with heading", async ({ page }) => {
    await page.goto("/two-factor");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Enter verification code");
  });
});

test.describe("Account Locked Page", () => {
  test("renders with heading", async ({ page }) => {
    await page.goto("/account-locked");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("temporarily locked");
  });

  test("shows countdown timer", async ({ page }) => {
    await page.goto("/account-locked");
    await expect(page.getByText(/failed sign-in attempts/i)).toBeVisible();
  });

  test("has reset password link", async ({ page }) => {
    await page.goto("/account-locked");
    await expect(page.getByRole("link", { name: /reset password/i })).toBeVisible();
  });
});

test.describe("Account Suspended Page", () => {
  test("renders with heading", async ({ page }) => {
    await page.goto("/account-suspended");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("account has been suspended");
  });

  test("has contact support link", async ({ page }) => {
    await page.goto("/account-suspended");
    await expect(page.getByRole("link", { name: /contact support/i })).toBeVisible();
  });

  test("has appeal link", async ({ page }) => {
    await page.goto("/account-suspended");
    await expect(page.getByRole("link", { name: /appeal/i })).toBeVisible();
  });
});

test.describe("Account Deletion Confirmation Page", () => {
  test("renders with heading", async ({ page }) => {
    await page.goto("/account-deletion-confirm");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("account deletion is scheduled");
  });

  test("shows what will be deleted", async ({ page }) => {
    await page.goto("/account-deletion-confirm");
    await expect(page.getByText(/permanently deleted/i)).toBeVisible();
    await expect(page.getByText(/profile and account data/i)).toBeVisible();
  });

  test("has cancel deletion button", async ({ page }) => {
    await page.goto("/account-deletion-confirm");
    await expect(page.getByRole("button", { name: /cancel deletion/i })).toBeVisible();
  });
});
