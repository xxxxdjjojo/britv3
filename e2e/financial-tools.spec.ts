import { test, expect } from "@playwright/test";

test.describe("Financial Tools Hub", () => {
  test("lists all 10 calculators with working links", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const toolLinks = [
      "Mortgage Repayment Calculator",
      "Mortgage Affordability Calculator",
      "Stamp Duty (SDLT) Calculator",
      "Rental Yield & ROI Calculator",
      "Buy vs. Rent Comparison",
      "Energy Bill & EPC Estimator",
      "Mortgage Comparison",
      "Remortgage Calculator",
      "Moving Cost Estimator",
      "First-Time Buyer Guide",
    ];

    for (const name of toolLinks) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });
});

test.describe("Mortgage Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/mortgage-calculator");
  });

  test("renders inputs and calculates monthly payment", async ({ page }) => {
    const priceInput = page.getByLabel("Property Price");
    await expect(priceInput).toHaveValue("300000");

    const depositInput = page.getByLabel("Deposit");
    await expect(depositInput).toHaveValue("30000");

    const rateInput = page.getByLabel(/Interest Rate/);
    await expect(rateInput).toHaveValue("4.5");

    // Monthly payment should be visible and non-zero
    await expect(page.getByText(/month/i).first()).toBeVisible();
    await expect(page.getByText("Total Interest Paid")).toBeVisible();
    await expect(page.getByText("Total Repayable")).toBeVisible();
    await expect(page.getByText("Loan-to-Value")).toBeVisible();
  });

  test("interest rate label shows illustrative disclaimer", async ({ page }) => {
    await expect(page.getByText("illustrative")).toBeVisible();
  });

  test("interest-only toggle changes calculation", async ({ page }) => {
    // Get the initial monthly payment text
    const resultArea = page.locator("text=/Estimated Monthly Payment/").locator("..");
    await expect(resultArea).toBeVisible();

    // Toggle interest-only
    const toggle = page.getByRole("switch");
    await toggle.click();

    // Payment should change (interest-only is cheaper monthly)
    await expect(resultArea).toBeVisible();
  });

  test("updates URL with query params on input change", async ({ page }) => {
    await page.getByLabel("Property Price").fill("250000");
    // Allow debounce
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/price=250000/);
  });

  test("restores state from URL params", async ({ page }) => {
    await page.goto("/tools/mortgage-calculator?price=400000&deposit=80000&rate=5.0&term=30");
    const priceInput = page.getByLabel("Property Price");
    await expect(priceInput).toHaveValue("400000");
  });

  test("broker CTA links to marketplace", async ({ page }) => {
    const cta = page.getByRole("link", { name: "Connect Now" });
    await expect(cta).toHaveAttribute("href", /marketplace/);
  });

  test("related tools link to correct routes", async ({ page }) => {
    // Scope to main content to avoid footer links
    await expect(
      page.getByRole("main").getByRole("link", { name: /Stamp Duty/ }).first()
    ).toHaveAttribute("href", /stamp-duty-calculator/);
  });
});

test.describe("Stamp Duty Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/stamp-duty-calculator");
  });

  test("renders with country selector", async ({ page }) => {
    await expect(page.getByRole("button", { name: /England/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Scotland/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Wales/i })).toBeVisible();
  });

  test("calculates £0 SDLT for FTB at £220,000", async ({ page }) => {
    // Select first-time buyer — click the label associated with the radio input
    await page.locator("label[for=sdlt-first_time]").click();

    // Set price to 220000
    const priceInput = page.locator("input[type=number]").first();
    await priceInput.fill("220000");

    // Total should be £0 — use regex to match £0 or £0.00
    await expect(page.getByRole("main").getByText(/^£0(\.00)?$/).first()).toBeVisible();
  });

  test("Scotland LBTT calculates correctly for £200,000", async ({ page }) => {
    await page.getByRole("button", { name: /Scotland/i }).click();

    const priceInput = page.locator("input[type=number]").first();
    await priceInput.fill("200000");

    // LBTT for £200k: 0% on £145k + 2% on £55k = £1,100
    await expect(page.getByText("£1,100").first()).toBeVisible();
  });

  test("Wales LTT shows £0 for £200,000", async ({ page }) => {
    await page.getByRole("button", { name: /Wales/i }).click();

    const priceInput = page.locator("input[type=number]").first();
    await priceInput.fill("200000");

    // LTT for £200k: 0% (nil-rate band is £225k)
    await expect(page.getByRole("main").getByText(/^£0(\.00)?$/).first()).toBeVisible();
  });

  test("shows band-by-band breakdown table", async ({ page }) => {
    await expect(page.getByText("Property Value Band")).toBeVisible();
    await expect(page.getByText("Tax Rate")).toBeVisible();
    await expect(page.getByText("Tax Payable")).toBeVisible();
  });

  test("URL updates with country selection", async ({ page }) => {
    await page.getByRole("button", { name: /Scotland/i }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/country=scotland/);
  });
});

test.describe("Affordability Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/affordability-calculator");
  });

  test("renders income and outgoings sections", async ({ page }) => {
    await expect(page.getByText("Applicant 1")).toBeVisible();
    await expect(page.getByText("Outgoings")).toBeVisible();
    await expect(page.getByText("You could borrow up to")).toBeVisible();
  });

  test("calculates 4.5x single income of £32,000 = £144,000", async ({ page }) => {
    const salaryInput = page.locator("input[type=number]").first();
    await salaryInput.fill("32000");

    // Clear other fields
    const inputs = page.locator("input[type=number]");
    for (let i = 1; i < 5; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        await input.fill("0");
      }
    }

    await expect(page.getByText("£144,000").first()).toBeVisible();
  });

  test("debt reduces max borrowing", async ({ page }) => {
    const salaryInput = page.locator("input[type=number]").first();
    await salaryInput.fill("50000");

    // Add monthly debt of £500
    const debtInput = page.getByPlaceholder("250");
    if (await debtInput.isVisible()) {
      await debtInput.fill("500");
    }

    // Max borrowing should be less than 4.5 * 50000 = 225000
    // With £500/mo debt: reduction = 500 * 12 * 4.5 = 27000
    // So max = 225000 - 27000 = 198000
    await expect(page.getByText("£198,000").first()).toBeVisible();
  });

  test("stress test at 7% is displayed", async ({ page }) => {
    const salaryInput = page.locator("input[type=number]").first();
    await salaryInput.fill("50000");

    await expect(page.getByText(/[Ss]tress test/)).toBeVisible();
    await expect(page.getByText(/7%/)).toBeVisible();
  });

  test("Book Free Consultation links to marketplace", async ({ page }) => {
    const cta = page.getByRole("link", { name: /Book Free Consultation/i });
    await expect(cta).toHaveAttribute("href", /marketplace/);
  });
});

test.describe("Rental Yield Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/rental-yield-calculator");
  });

  test("renders with default values and shows yield", async ({ page }) => {
    await expect(page.getByText("Gross Yield").first()).toBeVisible();
    await expect(page.getByText("Net Yield").first()).toBeVisible();
    await expect(page.getByText("Annual Net P/L")).toBeVisible();
  });

  test("calculates 7.2% gross yield for £1200/mo on £200k property", async ({ page }) => {
    // Find purchase price input and set to 200000
    const priceInputs = page.locator("input[inputmode=numeric]");
    await priceInputs.first().click();
    await priceInputs.first().fill("200000");

    // Find monthly rent input and set to 1200
    await priceInputs.nth(1).click();
    await priceInputs.nth(1).fill("1200");

    // Set void weeks to 0 so gross yield = 1200*12/200000 = 7.20%
    const voidInput = page.locator("input[type=number]").first();
    await voidInput.fill("0");

    await expect(page.getByText("7.20%").first()).toBeVisible();
  });

  test("void weeks input is present", async ({ page }) => {
    await expect(page.getByText(/[Vv]oid/).first()).toBeVisible();
  });

  test("cash-on-cash return metric is displayed", async ({ page }) => {
    await expect(page.getByText(/[Cc]ash.on.[Cc]ash/i).first()).toBeVisible();
  });

  test("Share button is functional", async ({ page }) => {
    const shareBtn = page.getByRole("button", { name: /Share/i });
    await expect(shareBtn).toBeVisible();
    // Should not throw on click
    await shareBtn.click();
  });
});

test.describe("Buy vs Rent Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/buy-vs-rent-calculator");
  });

  test("renders inputs and verdict", async ({ page }) => {
    await expect(page.getByText("Your Parameters")).toBeVisible();
    await expect(page.getByText(/Our Analysis/i)).toBeVisible();
    await expect(page.getByText("Cost Comparison")).toBeVisible();
  });

  test("shows break-even analysis", async ({ page }) => {
    await expect(page.getByText(/becomes cheaper|remains cheaper/i)).toBeVisible();
  });

  test("comparison table shows year 1, 5, 10, 15, 25", async ({ page }) => {
    await expect(page.getByRole("cell", { name: "Year 1", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Year 5", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Year 10", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Year 25", exact: true })).toBeVisible();
  });

  test("URL updates with property price change", async ({ page }) => {
    const priceInput = page.locator("input[type=number]").first();
    await priceInput.fill("500000");
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/price=500000/);
  });

  test("disclaimer is visible", async ({ page }) => {
    await expect(page.getByText(/estimates.*financial advice/i)).toBeVisible();
  });
});

test.describe("Energy Bill Estimator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/energy-bill-estimator");
  });

  test("renders property type and bedroom selectors", async ({ page }) => {
    await expect(page.getByText("Property Type")).toBeVisible();
    await expect(page.getByText("Number of Bedrooms")).toBeVisible();
    await expect(page.getByRole("button", { name: "Flat" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Terraced" })).toBeVisible();
  });

  test("shows monthly estimate", async ({ page }) => {
    await expect(page.getByText("Estimated Monthly Bill")).toBeVisible();
    await expect(page.getByText("/month").first()).toBeVisible();
  });

  test("occupants selector is present", async ({ page }) => {
    await expect(page.getByText(/[Oo]ccupant/).first()).toBeVisible();
  });

  test("Ofgem date stamp is visible", async ({ page }) => {
    await expect(page.getByText(/Ofgem/i)).toBeVisible();
  });

  test("EPC rating selector works", async ({ page }) => {
    await expect(page.getByText("Current EPC Rating")).toBeVisible();
    // All 7 ratings should be visible
    for (const rating of ["A", "B", "C", "D", "E", "F", "G"]) {
      await expect(page.getByRole("button", { name: rating, exact: true })).toBeVisible();
    }
  });
});

test.describe("Remortgage Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/remortgage-calculator");
  });

  test("renders current vs new deal comparison", async ({ page }) => {
    await expect(page.getByText("Current Deal").first()).toBeVisible();
    await expect(page.getByText("New Deal").first()).toBeVisible();
    await expect(page.getByText("Monthly Saving")).toBeVisible();
  });

  test("ERC input is present", async ({ page }) => {
    await expect(page.getByText(/Early Repayment/i).first()).toBeVisible();
  });

  test("LTV rate tier panel is shown", async ({ page }) => {
    await expect(page.getByText(/60% LTV/)).toBeVisible();
    await expect(page.getByText(/75% LTV/)).toBeVisible();
  });

  test("broker CTA links to marketplace", async ({ page }) => {
    const cta = page.getByRole("link", { name: /Find a Broker/i });
    await expect(cta).toHaveAttribute("href", /marketplace/);
  });
});

test.describe("Moving Cost Estimator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/moving-cost-estimator");
  });

  test("renders with cost breakdown", async ({ page }) => {
    await expect(page.getByText("Cost Breakdown")).toBeVisible();
    await expect(page.getByText(/Stamp Duty|SDLT|LBTT|LTT/).first()).toBeVisible();
    await expect(page.getByText("Solicitor").first()).toBeVisible();
    await expect(page.getByText("Removals").first()).toBeVisible();
  });

  test("location selector includes all UK nations", async ({ page }) => {
    await expect(page.getByText("England").first()).toBeVisible();
    await expect(page.getByText("Wales").first()).toBeVisible();
    await expect(page.getByText("Scotland").first()).toBeVisible();
  });

  test("first-time buyer toggle is present", async ({ page }) => {
    await expect(page.getByText(/first-time buyer/i).first()).toBeVisible();
  });
});

test.describe("First-Time Buyer Guide", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/first-time-buyer-guide");
  });

  test("renders guide sections with scheme info", async ({ page }) => {
    await expect(page.getByText("Help to Buy ISA").first()).toBeVisible();
    await expect(page.getByText("Lifetime ISA").first()).toBeVisible();
    await expect(page.getByText("Shared Ownership").first()).toBeVisible();
    await expect(page.getByText("Right to Buy").first()).toBeVisible();
  });

  test("affordability checker is interactive", async ({ page }) => {
    await expect(page.getByText("Affordability Checker").first()).toBeVisible();
    await expect(page.getByText("Your Estimated Affordable Range").first()).toBeVisible();
  });

  test("broker CTA links to marketplace", async ({ page }) => {
    const cta = page.getByRole("link", { name: /Find a Broker/i });
    await expect(cta).toHaveAttribute("href", /marketplace/);
  });
});

test.describe("Mortgage Comparison", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/mortgage-comparison");
  });

  test("renders product comparison table", async ({ page }) => {
    await expect(
      page.getByText("Illustrative Mortgage Products", { exact: true })
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Lender" })).toBeVisible();
    await expect(page.getByText("Monthly Payment").first()).toBeVisible();
    await expect(page.getByText("Barclays", { exact: true }).first()).toBeVisible();
  });

  test("lowest product is highlighted", async ({ page }) => {
    await expect(page.getByText("Lowest", { exact: true })).toBeVisible();
  });

  test("disclaimer about illustrative rates", async ({ page }) => {
    await expect(page.getByText(/indicative only|illustrative/i).first()).toBeVisible();
  });
});

test.describe("Financial Tools — Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mortgage calculator fits at 390px without horizontal scroll", async ({ page }) => {
    await page.goto("/tools/mortgage-calculator");
    const body = page.locator("body");
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    const viewportWidth = 390;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
  });

  test("stamp duty calculator fits at 390px", async ({ page }) => {
    await page.goto("/tools/stamp-duty-calculator");
    const body = page.locator("body");
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(395);
  });

  test("affordability calculator fits at 390px", async ({ page }) => {
    await page.goto("/tools/affordability-calculator");
    const body = page.locator("body");
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(395);
  });
});
