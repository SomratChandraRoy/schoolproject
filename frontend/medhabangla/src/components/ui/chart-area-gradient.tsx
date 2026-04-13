"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export const description = "An area chart with gradient fill";

type ChartAreaGradientPoint = {
  label: string;
  desktop: number;
  mobile: number;
};

interface ChartAreaGradientProps {
  className?: string;
  title?: string;
  description?: string;
  footerTitle?: string;
  footerSubtext?: string;
  desktopLabel?: string;
  mobileLabel?: string;
  data?: ChartAreaGradientPoint[];
}

const defaultChartData: ChartAreaGradientPoint[] = [
  { label: "January", desktop: 186, mobile: 80 },
  { label: "February", desktop: 305, mobile: 200 },
  { label: "March", desktop: 237, mobile: 120 },
  { label: "April", desktop: 73, mobile: 190 },
  { label: "May", desktop: 209, mobile: 130 },
  { label: "June", desktop: 214, mobile: 140 },
];

export function ChartAreaGradient({
  className,
  title = "Area Chart - Gradient",
  description = "Showing total visitors for the last 6 months",
  footerTitle = "Trending up by 5.2% this month",
  footerSubtext = "January - June 2024",
  desktopLabel = "Desktop",
  mobileLabel = "Mobile",
  data = defaultChartData,
}: ChartAreaGradientProps) {
  const chartConfig = {
    desktop: {
      label: desktopLabel,
      color: "hsl(var(--chart-1))",
    },
    mobile: {
      label: mobileLabel,
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                typeof value === "string" ? value.slice(0, 3) : String(value)
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              fillOpacity={0.4}
              stroke="hsl(var(--chart-2))"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              fillOpacity={0.4}
              stroke="hsl(var(--chart-1))"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {footerTitle} <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {footerSubtext}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
