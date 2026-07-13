/**
 * Canonical chart colour hex constants.
 *
 * Light-mode values mirror --chart-1..--chart-5 in src/app/globals.css.
 * Dark-mode values mirror the .dark overrides.
 * Import these instead of hardcoding hex strings in recharts call sites.
 */

export const chartColors = {
  light: {
    chart1: "#1B4D3E",
    chart2: "#2D7A5F",
    chart3: "#A07D2E",
    chart4: "#2563EB",
    chart5: "#16A34A",
  },
  dark: {
    chart1: "#2D7A5F",
    chart2: "#D4A853",
    chart3: "#2563EB",
    chart4: "#16A34A",
    chart5: "#9E9EAB",
  },
} as const;

/** Named exports for direct import of light-mode colours (most common case). */
export const CHART_1 = chartColors.light.chart1;
export const CHART_2 = chartColors.light.chart2;
export const CHART_3 = chartColors.light.chart3;
export const CHART_4 = chartColors.light.chart4;
export const CHART_5 = chartColors.light.chart5;
