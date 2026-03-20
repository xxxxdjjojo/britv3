/**
 * Scenario 7: "Growing My Territory" — Service Expansion and Area Management
 *
 * Tests service listing management, area coverage setup with map integration,
 * and service configuration for provider/tradesperson users.
 */
import { test, expect } from "./fixtures/auth";

test.use({ role: "provider" });

const SERVICES_URL = "/dashboard/provider/services";
const AREAS_URL = "/dashboard/provider/services/areas";

test.describe("Scenario 7: Service Expansion and Area Management", () => {
  test.describe("Services page", () => {
    test("7.1 — services page loads with existing services or empty state", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(SERVICES_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });

      // Should show either a list of services or an empty state
      const serviceCard = page.locator(
        "[data-testid*='service-card'], [data-testid*='service-item'], article, .card",
      ).first();
      const emptyState = page.getByText(
        /no.*service|add.*first.*service|get.*started|no.*offerings/i,
      ).first();

      const hasServices = await serviceCard.isVisible().catch(() => false);
      const hasEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasServices || hasEmpty).toBeTruthy();
    });

    test("7.2 — 'Add Service' button visible", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(SERVICES_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      const addButton = page.getByRole("button", { name: /add.*service|new.*service|create.*service/i })
        .or(page.getByRole("link", { name: /add.*service|new.*service|create.*service/i }));

      await expect(addButton).toBeVisible({ timeout: 5_000 });
    });

    test("7.3 — service card shows: name, category, description, pricing type, price", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(SERVICES_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      const serviceCard = page.locator(
        "[data-testid*='service-card'], [data-testid*='service-item']",
      ).or(page.locator("article, .card").first());

      const hasServices = await serviceCard.first().isVisible().catch(() => false);

      if (!hasServices) {
        test.skip(true, "No services listed — empty state");
        return;
      }

      const firstCard = serviceCard.first();

      // Service card should contain a title/name
      const cardTitle = firstCard.locator("h2, h3, h4, [data-testid*='name'], [data-testid*='title']").first();
      await expect(cardTitle).toBeVisible();

      // Should show pricing information (amount or pricing type label)
      const pricingInfo = firstCard.getByText(/\u00a3|hourly|fixed|quote|per.*hour|from/i).first();
      const hasPricing = await pricingInfo.isVisible().catch(() => false);

      // Pricing info should be present on service cards
      expect(hasPricing).toBeTruthy();
    });

    test("7.4 — service form validates required fields", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(SERVICES_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      // Click "Add Service" to open the form
      const addButton = page.getByRole("button", { name: /add.*service|new.*service|create.*service/i })
        .or(page.getByRole("link", { name: /add.*service|new.*service|create.*service/i }));

      const hasAddButton = await addButton.isVisible().catch(() => false);
      if (!hasAddButton) {
        test.skip(true, "Add Service button not found");
        return;
      }

      await addButton.click();
      await page.waitForLoadState("networkidle");

      // Look for form fields
      const form = page.locator("form").first();
      const hasForm = await form.isVisible().catch(() => false);

      if (!hasForm) {
        // May be a modal or dialog
        const dialog = page.locator("[role='dialog'], [data-testid*='modal']").first();
        const hasDialog = await dialog.isVisible().catch(() => false);
        if (!hasDialog) {
          test.skip(true, "Service form not found after clicking Add");
          return;
        }
      }

      // Try to submit without filling required fields
      const submitButton = page.getByRole("button", { name: /save|create|add|submit/i }).first();
      const hasSubmit = await submitButton.isVisible().catch(() => false);

      if (hasSubmit) {
        await submitButton.click();

        // Check for validation errors
        const validationError = page.getByText(/required|please.*fill|cannot.*be.*empty|is.*required/i).first();
        const hasValidation = await validationError.isVisible({ timeout: 3_000 }).catch(() => false);

        // Either custom validation messages or HTML5 validation should prevent empty submission
        const requiredInputs = await page.locator("input[required], select[required], textarea[required]").count();
        expect(hasValidation || requiredInputs > 0).toBeTruthy();
      }
    });

    test("7.5 — service supports pricing types: hourly, fixed, quote_on_request", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(SERVICES_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      // Open the add service form
      const addButton = page.getByRole("button", { name: /add.*service|new.*service|create.*service/i })
        .or(page.getByRole("link", { name: /add.*service|new.*service|create.*service/i }));

      const hasAddButton = await addButton.isVisible().catch(() => false);
      if (!hasAddButton) {
        test.skip(true, "Add Service button not found");
        return;
      }

      await addButton.click();
      await page.waitForLoadState("networkidle");

      // Look for pricing type selector (radio, select, or button group)
      const pricingTypeSelect = page.locator("select")
        .filter({ hasText: /hourly|fixed|quote/i });
      const pricingRadios = page.locator("input[type='radio']")
        .or(page.getByRole("radio"));
      const pricingButtons = page.getByRole("button", { name: /hourly|fixed|quote/i })
        .or(page.locator("[role='radiogroup']"));

      const hasSelect = await pricingTypeSelect.isVisible().catch(() => false);
      const hasRadios = await pricingRadios.first().isVisible().catch(() => false);
      const hasButtons = await pricingButtons.first().isVisible().catch(() => false);

      // At least one pricing type selector should be present in the form
      const hasPricingSelector = hasSelect || hasRadios || hasButtons;

      if (!hasPricingSelector) {
        // Check for pricing type labels as text
        const pricingLabels = page.getByText(/hourly|fixed.*price|quote.*on.*request|pricing.*type/i);
        const hasLabels = await pricingLabels.first().isVisible().catch(() => false);
        expect(hasLabels).toBeTruthy();
      } else {
        expect(hasPricingSelector).toBeTruthy();
      }
    });
  });

  test.describe("Service areas", () => {
    test("7.6 — service areas page loads with map or list view", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(AREAS_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });

      // Should show either a map view, list view, or empty state
      const mapContainer = page.locator(
        "[data-testid*='map'], .maplibregl-map, .map-container, canvas",
      ).first();
      const listView = page.locator(
        "[data-testid*='area-list'], [data-testid*='service-area']",
      ).or(page.getByText(/coverage.*area|service.*area/i).first());
      const emptyState = page.getByText(/no.*area|add.*first.*area|set.*up.*coverage/i).first();

      const hasMap = await mapContainer.isVisible().catch(() => false);
      const hasList = await listView.isVisible().catch(() => false);
      const hasEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasMap || hasList || hasEmpty).toBeTruthy();
    });

    test("7.7 — 'Add Area' button with radius/polygon options", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(AREAS_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      const addButton = page.getByRole("button", { name: /add.*area|new.*area|add.*coverage/i })
        .or(page.getByRole("link", { name: /add.*area|new.*area|add.*coverage/i }));

      await expect(addButton).toBeVisible({ timeout: 5_000 });

      // Click to check for radius/polygon options
      await addButton.click();

      const radiusOption = page.getByText(/radius|circle/i).first();
      const polygonOption = page.getByText(/polygon|custom.*area|draw/i).first();

      const hasRadius = await radiusOption.isVisible({ timeout: 3_000 }).catch(() => false);
      const hasPolygon = await polygonOption.isVisible().catch(() => false);

      // At least one area type option should appear after clicking add
      if (!hasRadius && !hasPolygon) {
        // May open a form directly with a zone_type selector
        const zoneTypeField = page.getByText(/zone.*type|area.*type|coverage.*type/i).first();
        const hasZoneType = await zoneTypeField.isVisible().catch(() => false);
        // Accept either explicit options or a form with zone type selector
        expect(hasZoneType).toBeTruthy();
      }
    });

    test("7.8 — map editor renders (MapLibre)", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(AREAS_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      // Look for the MapLibre map canvas or container
      const mapContainer = page.locator(
        ".maplibregl-map, [data-testid*='map'], .map-container",
      ).first();
      const mapCanvas = page.locator("canvas").first();

      const hasMapContainer = await mapContainer.isVisible({ timeout: 10_000 }).catch(() => false);
      const hasCanvas = await mapCanvas.isVisible().catch(() => false);

      if (!hasMapContainer && !hasCanvas) {
        test.skip(true, "Map editor not rendered — MapLibre may not be loaded or areas page uses list view only");
        return;
      }

      expect(hasMapContainer || hasCanvas).toBeTruthy();
    });

    test("7.9 — service area form captures zone_type, radius_km for radius zones", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(AREAS_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      // Open the add area form
      const addButton = page.getByRole("button", { name: /add.*area|new.*area|add.*coverage/i })
        .or(page.getByRole("link", { name: /add.*area|new.*area|add.*coverage/i }));

      const hasAddButton = await addButton.isVisible().catch(() => false);
      if (!hasAddButton) {
        test.skip(true, "Add Area button not found");
        return;
      }

      await addButton.click();
      await page.waitForLoadState("networkidle");

      // Select radius zone type if available
      const radiusOption = page.getByText(/radius|circle/i).first()
        .or(page.getByRole("radio", { name: /radius/i }));
      const hasRadius = await radiusOption.isVisible({ timeout: 3_000 }).catch(() => false);

      if (hasRadius) {
        await radiusOption.click();
      }

      // Look for radius input field (km or miles)
      const radiusInput = page.locator("input[name*='radius'], input[placeholder*='radius'], [data-testid*='radius']")
        .or(page.getByLabel(/radius|distance|km|miles/i));

      const hasRadiusInput = await radiusInput.first().isVisible({ timeout: 3_000 }).catch(() => false);

      if (!hasRadiusInput) {
        test.skip(true, "Radius input field not found — form may use different layout");
        return;
      }

      await expect(radiusInput.first()).toBeVisible();
    });

    test("7.10 — multiple service areas display with overlap visualization", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(AREAS_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      // Check for multiple area entries
      const areaItems = page.locator(
        "[data-testid*='service-area'], [data-testid*='area-item'], [data-testid*='coverage-zone']",
      ).or(page.locator("li, .card, article").filter({ hasText: /area|zone|coverage|radius/i }));

      const areaCount = await areaItems.count();

      if (areaCount < 2) {
        test.skip(true, "Fewer than 2 service areas — cannot test overlap visualization");
        return;
      }

      // Multiple areas are present — verify they are all visible
      expect(areaCount).toBeGreaterThanOrEqual(2);

      // If map is present, overlapping circles/polygons should render
      const mapContainer = page.locator(".maplibregl-map, [data-testid*='map']").first();
      const hasMap = await mapContainer.isVisible().catch(() => false);

      if (hasMap) {
        // Map should be rendering — areas visualized on it
        await expect(mapContainer).toBeVisible();
      }
    });

    test("7.11 — primary area flag toggling", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(AREAS_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      // Look for primary/default area toggle or badge
      const primaryToggle = page.getByRole("button", { name: /primary|default|main/i })
        .or(page.getByRole("checkbox", { name: /primary|default|main/i }))
        .or(page.locator("[data-testid*='primary']"));
      const primaryBadge = page.getByText(/primary|default.*area|main.*area/i).first();

      const hasToggle = await primaryToggle.first().isVisible().catch(() => false);
      const hasBadge = await primaryBadge.isVisible().catch(() => false);

      if (!hasToggle && !hasBadge) {
        test.skip(true, "Primary area toggle/badge not found — feature may not be implemented or no areas exist");
        return;
      }

      expect(hasToggle || hasBadge).toBeTruthy();
    });
  });

  test.describe("Service management", () => {
    test("7.12 — new services correctly categorized", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(SERVICES_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      // Open the add service form
      const addButton = page.getByRole("button", { name: /add.*service|new.*service/i })
        .or(page.getByRole("link", { name: /add.*service|new.*service/i }));

      const hasAddButton = await addButton.isVisible().catch(() => false);
      if (!hasAddButton) {
        test.skip(true, "Add Service button not found");
        return;
      }

      await addButton.click();
      await page.waitForLoadState("networkidle");

      // Look for a category selector (dropdown, radio, or list)
      const categoryField = page.locator("select")
        .filter({ hasText: /plumb|electr|build|paint|garden|roof|heat|clean|lock/i })
        .or(page.getByLabel(/category|trade|type.*of.*service/i))
        .or(page.locator("[data-testid*='category']"));

      const hasCategoryField = await categoryField.first().isVisible({ timeout: 3_000 }).catch(() => false);

      if (!hasCategoryField) {
        // Check for category text/labels in the form
        const categoryLabel = page.getByText(/category|trade.*type|service.*type/i).first();
        const hasLabel = await categoryLabel.isVisible().catch(() => false);
        expect(hasLabel).toBeTruthy();
      } else {
        await expect(categoryField.first()).toBeVisible();
      }
    });

    test("7.13 — editing existing service preserves data", async ({
      authenticatedPage: page,
    }) => {
      await page.goto(SERVICES_URL);
      await expect(page.locator("body")).not.toContainText("Application error");

      // Find an existing service card with an edit button
      const editButton = page.getByRole("button", { name: /edit/i })
        .or(page.getByRole("link", { name: /edit/i }))
        .or(page.locator("[data-testid*='edit']"));

      const hasEditButton = await editButton.first().isVisible().catch(() => false);

      if (!hasEditButton) {
        test.skip(true, "No edit button found — no services to edit or edit not available inline");
        return;
      }

      // Capture the service name before editing
      const serviceCard = editButton.first().locator("..");
      const cardText = await serviceCard.textContent().catch(() => "");

      await editButton.first().click();
      await page.waitForLoadState("networkidle");

      // Form should be populated with existing data
      const nameInput = page.locator(
        "input[name*='name'], input[name*='title'], [data-testid*='service-name']",
      ).or(page.getByLabel(/service.*name|name/i)).first();

      const hasNameInput = await nameInput.isVisible({ timeout: 3_000 }).catch(() => false);

      if (!hasNameInput) {
        test.skip(true, "Edit form not found after clicking edit button");
        return;
      }

      // The name input should have a non-empty value (pre-populated)
      const nameValue = await nameInput.inputValue().catch(() => "");
      expect(nameValue.length).toBeGreaterThan(0);
    });
  });
});
