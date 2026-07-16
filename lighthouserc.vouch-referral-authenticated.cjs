module.exports = {
  ci: {
    collect: {
      url: ["http://127.0.0.1:3014/dashboard/provider"],
      numberOfRuns: 3,
      puppeteerScript: "./scripts/e2e-vouch-referral-lighthouse-auth.cjs",
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9, aggregationMethod: "median" }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500, aggregationMethod: "median" }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1, aggregationMethod: "median" }],
        "total-blocking-time": ["error", { maxNumericValue: 200, aggregationMethod: "median" }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "test-results/evidence/vouch-referral/lighthouse-authenticated",
    },
  },
};
