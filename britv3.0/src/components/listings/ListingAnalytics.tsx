import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, MessageSquare, Calendar } from "lucide-react";
import { PriceHistory } from "./PriceHistory";
import type { PriceHistory as PriceHistoryType } from "@/types/property";

type StatCardProps = Readonly<{
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}>;

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-neutral-500">
          {label}
        </CardTitle>
        <Icon className="size-5 text-neutral-400" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-neutral-900">
          {new Intl.NumberFormat("en-GB").format(value)}
        </p>
      </CardContent>
    </Card>
  );
}

type ListingAnalyticsProps = Readonly<{
  viewCount: number;
  favoriteCount: number;
  enquiryCount: number;
  listedDate: string;
  priceHistory: PriceHistoryType[];
}>;

export function ListingAnalytics({
  viewCount,
  favoriteCount,
  enquiryCount,
  listedDate,
  priceHistory,
}: ListingAnalyticsProps) {
  const listedDateObj = new Date(listedDate);
  const now = new Date();
  const daysOnMarket = Math.max(
    0,
    Math.floor(
      (now.getTime() - listedDateObj.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Views" value={viewCount} icon={Eye} />
        <StatCard label="Total Saves" value={favoriteCount} icon={Heart} />
        <StatCard
          label="Total Enquiries"
          value={enquiryCount}
          icon={MessageSquare}
        />
      </div>

      {/* Days on Market */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-neutral-500">
            Time on Market
          </CardTitle>
          <Calendar className="size-5 text-neutral-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-neutral-900">
            {daysOnMarket} {daysOnMarket === 1 ? "day" : "days"}
          </p>
          <p className="text-xs text-neutral-400">
            Listed{" "}
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(listedDateObj)}
          </p>
        </CardContent>
      </Card>

      {/* Price History */}
      <PriceHistory history={priceHistory} />
    </div>
  );
}
