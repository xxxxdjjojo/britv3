import { MarketAppraisalTool } from "@/components/dashboard/agent/sales/MarketAppraisalTool";

export default function MarketAppraisalPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Market Appraisal
        </h1>
        <p className="text-sm text-muted-foreground">
          Search comparable sold properties and generate a suggested price range
          for any UK postcode.
        </p>
      </div>

      <MarketAppraisalTool />
    </div>
  );
}
