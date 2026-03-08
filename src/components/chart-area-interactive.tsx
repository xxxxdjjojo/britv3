"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Property views and enquiries over time"

const chartData = [
  { date: "2025-10-01", views: 1820, enquiries: 245 },
  { date: "2025-10-05", views: 2140, enquiries: 312 },
  { date: "2025-10-10", views: 1960, enquiries: 287 },
  { date: "2025-10-15", views: 2450, enquiries: 356 },
  { date: "2025-10-20", views: 2680, enquiries: 390 },
  { date: "2025-10-25", views: 2340, enquiries: 345 },
  { date: "2025-10-30", views: 2890, enquiries: 412 },
  { date: "2025-11-05", views: 3120, enquiries: 445 },
  { date: "2025-11-10", views: 2780, enquiries: 398 },
  { date: "2025-11-15", views: 3340, enquiries: 478 },
  { date: "2025-11-20", views: 3560, enquiries: 512 },
  { date: "2025-11-25", views: 3180, enquiries: 456 },
  { date: "2025-11-30", views: 3720, enquiries: 534 },
  { date: "2025-12-05", views: 3450, enquiries: 498 },
  { date: "2025-12-10", views: 2980, enquiries: 423 },
  { date: "2025-12-15", views: 2540, enquiries: 367 },
  { date: "2025-12-20", views: 2120, enquiries: 312 },
  { date: "2025-12-25", views: 1680, enquiries: 234 },
  { date: "2025-12-30", views: 2340, enquiries: 345 },
  { date: "2026-01-05", views: 3890, enquiries: 556 },
  { date: "2026-01-10", views: 4120, enquiries: 589 },
  { date: "2026-01-15", views: 4350, enquiries: 623 },
  { date: "2026-01-20", views: 4680, enquiries: 667 },
  { date: "2026-01-25", views: 4210, enquiries: 601 },
  { date: "2026-01-30", views: 4890, enquiries: 698 },
  { date: "2026-02-05", views: 5120, enquiries: 734 },
  { date: "2026-02-10", views: 4780, enquiries: 684 },
  { date: "2026-02-15", views: 5340, enquiries: 768 },
  { date: "2026-02-20", views: 5560, enquiries: 798 },
  { date: "2026-02-25", views: 5890, enquiries: 845 },
  { date: "2026-02-28", views: 5240, enquiries: 752 },
  { date: "2026-03-01", views: 6120, enquiries: 878 },
  { date: "2026-03-05", views: 6450, enquiries: 924 },
]

const chartConfig = {
  activity: {
    label: "Platform Activity",
  },
  views: {
    label: "Property Views",
    color: "var(--primary)",
  },
  enquiries: {
    label: "Enquiries",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2026-03-07")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Property Views &amp; Enquiries</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Platform activity across all UK regions
          </span>
          <span className="@[540px]/card:hidden">Platform activity</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value)
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-views)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-views)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillEnquiries" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-enquiries)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-enquiries)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-GB", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="enquiries"
              type="natural"
              fill="url(#fillEnquiries)"
              stroke="var(--color-enquiries)"
              stackId="a"
            />
            <Area
              dataKey="views"
              type="natural"
              fill="url(#fillViews)"
              stroke="var(--color-views)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
