module.exports = async (browser) => {
  const page = await browser.newPage();
  const baseURL = process.env.PERF_BASE_URL || "http://127.0.0.1:3014";
  await page.goto(`${baseURL}/login?redirectTo=%2Fdashboard%2Fprovider`, {
    waitUntil: "networkidle0",
  });
  await page.type('input[name="email"]', "vouch-gate-empty@truedeed.test");
  await page.type('input[name="password"]', "VouchEvidence123!");
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => window.location.pathname.startsWith("/dashboard/provider"),
    { timeout: 30000 },
  );
  if (!page.url().includes("/dashboard/provider")) {
    throw new Error(`Authenticated Lighthouse login ended at ${page.url()}`);
  }
  await page.close();
};
