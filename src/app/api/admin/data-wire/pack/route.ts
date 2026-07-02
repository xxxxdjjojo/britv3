import { z } from "zod";
import {
  AdminActionError,
  auditedAdminActionWithPermission,
} from "@/lib/audited-admin-action";
import { appUrl } from "@/config/brand";
import { buildPressPack } from "@/content/data-wire/templates";
import {
  buildChartUrls,
  buildPackHtml,
  getWireAreas,
} from "@/services/data-wire/data-wire-service";

const requestSchema = z.object({
  areaId: z.string().min(1).max(120),
  period: z.string().regex(/^\d{4}-Q[1-4]$/),
});

/**
 * POST /api/admin/data-wire/pack — generates one localised press pack as a
 * downloadable self-contained HTML file. Audited via
 * auditedAdminActionWithPermission; suppressed/unknown districts are never
 * packaged (the wire-area list only contains visible league rows).
 */
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "areaId and period (e.g. 2026-Q2) are required" },
      { status: 400 },
    );
  }
  const { areaId, period } = parsed.data;

  let pack: { html: string; filename: string } | null = null;

  const audited = await auditedAdminActionWithPermission(
    req,
    "data_wire.pack_generated",
    "data_wire",
    areaId,
    "send_campaigns",
    async () => {
      const { areas } = await getWireAreas(period);
      const area = areas.find((candidate) => candidate.areaId === areaId);
      if (!area) {
        // Unknown district OR one below the disclosed sample thresholds
        // (suppressed rows never reach the wire-area list).
        throw new AdminActionError(
          "No publishable Reality Gap data for this district and period",
          404,
        );
      }

      const pressPack = buildPressPack({
        areaName: area.areaName,
        areaId: area.areaId,
        period: area.period,
        gapPct: area.gapPct,
        medianAsking: area.medianAskingPounds,
        medianSold: area.medianSoldPounds,
        sampleAsking: area.sampleAskingN,
        sampleSold: area.sampleSoldN,
        rank: area.rank,
        totalRanked: area.totalRanked,
      });
      const chartUrls = buildChartUrls(area, pressPack.headline, appUrl);
      const safeAreaId =
        area.areaId.toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "district";
      pack = {
        html: buildPackHtml(pressPack, chartUrls, {
          areaName: area.areaName,
          period: area.period,
        }),
        filename: `truedeed-data-wire-${safeAreaId}-${period}.html`,
      };
      return { ok: true, areaId, period };
    },
  );

  // The audit wrapper serialises fn results as JSON — for the download we
  // re-emit the generated HTML with an attachment disposition instead.
  if (!audited.ok || pack === null) return audited;
  const { html, filename } = pack as { html: string; filename: string };

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
