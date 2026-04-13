"use client";

import {
  BadgePercentIcon,
  BookOpenIcon,
  ChartNoAxesCombinedIcon,
  CirclePercentIcon,
  DollarSignIcon,
  Gamepad2Icon,
  ShoppingBagIcon,
  TrendingUpIcon,
} from "lucide-react";

import { Bar, BarChart, Label, Pie, PieChart } from "recharts";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type LearningSummary = {
  totalPoints: number;
  quizzesTaken: number;
  gamesPlayed: number;
  booksRead: number;
  streakDays: number;
  totalHoursLearned: number;
  level: number;
  levelProgress: number;
};

type SalesMetricsCardProps = {
  className?: string;
  learningSummary?: LearningSummary;
};

const defaultSalesMetricsData = [
  {
    icon: <TrendingUpIcon className="size-5" />,
    title: "Sales trend",
    value: "$11,548",
  },
  {
    icon: <BadgePercentIcon className="size-5" />,
    title: "Discount offers",
    value: "$1,326",
  },
  {
    icon: <DollarSignIcon className="size-5" />,
    title: "Net profit",
    value: "$17,356",
  },
  {
    icon: <ShoppingBagIcon className="size-5" />,
    title: "Total orders",
    value: "248",
  },
];

const defaultRevenueChartData = [
  { month: "january", sales: 340, fill: "var(--color-january)" },
  { month: "february", sales: 200, fill: "var(--color-february)" },
  { month: "march", sales: 200, fill: "var(--color-march)" },
];

const defaultRevenueChartConfig = {
  sales: {
    label: "Sales",
  },
  january: {
    label: "January",
    color: "var(--primary)",
  },
  february: {
    label: "February",
    color: "color-mix(in oklab, var(--primary) 60%, transparent)",
  },
  march: {
    label: "March",
    color: "color-mix(in oklab, var(--primary) 20%, transparent)",
  },
} satisfies ChartConfig;

const salesChartConfig = {
  sales: {
    label: "Sales",
  },
} satisfies ChartConfig;

const SalesMetricsCard = ({
  className,
  learningSummary,
}: SalesMetricsCardProps) => {
  const isLearningMode = Boolean(learningSummary);

  const levelProgress = learningSummary
    ? Math.max(0, Math.min(100, learningSummary.levelProgress))
    : 56;

  const salesPlanPercentage = isLearningMode
    ? Math.max(
        8,
        Math.min(
          100,
          Math.round(
            levelProgress * 0.68 + Math.min(learningSummary.streakDays * 2, 32),
          ),
        ),
      )
    : 54;

  const totalBars = 24;
  const filledBars = Math.round((salesPlanPercentage * totalBars) / 100);

  const salesChartData = Array.from({ length: totalBars }, (_, index) => {
    const date = new Date(2025, 5, 15);

    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return {
      date: formattedDate,
      sales: index < filledBars ? 315 : 0,
    };
  });

  const metricsData = isLearningMode
    ? [
        {
          icon: <TrendingUpIcon className="size-5" />,
          title: "Total points",
          value: `${learningSummary.totalPoints.toLocaleString()} pts`,
        },
        {
          icon: <BadgePercentIcon className="size-5" />,
          title: "Level progress",
          value: `${levelProgress}%`,
        },
        {
          icon: <Gamepad2Icon className="size-5" />,
          title: "Games played",
          value: String(learningSummary.gamesPlayed),
        },
        {
          icon: <BookOpenIcon className="size-5" />,
          title: "Books completed",
          value: String(learningSummary.booksRead),
        },
      ]
    : defaultSalesMetricsData;

  const revenueChartData = isLearningMode
    ? [
        {
          month: "quiz",
          sales: Math.max(1, learningSummary.quizzesTaken),
          fill: "var(--color-quiz)",
        },
        {
          month: "games",
          sales: Math.max(1, learningSummary.gamesPlayed),
          fill: "var(--color-games)",
        },
        {
          month: "books",
          sales: Math.max(1, learningSummary.booksRead),
          fill: "var(--color-books)",
        },
      ]
    : defaultRevenueChartData;

  const revenueChartConfig = isLearningMode
    ? ({
        sales: {
          label: "Activity",
        },
        quiz: {
          label: "Quizzes",
          color: "hsl(var(--chart-1))",
        },
        games: {
          label: "Games",
          color: "hsl(var(--chart-2))",
        },
        books: {
          label: "Books",
          color: "hsl(var(--chart-3))",
        },
      } satisfies ChartConfig)
    : defaultRevenueChartConfig;

  const mainTitle = isLearningMode ? "Learning metrics" : "Sales metrics";
  const profileName = isLearningMode ? "Student Performance" : "Sandy' Company";
  const profileSubtext = isLearningMode
    ? `Level ${learningSummary.level} dashboard`
    : "sandy@company.com";
  const donutValue = isLearningMode
    ? learningSummary.totalPoints.toLocaleString()
    : "256.24";
  const donutLabel = isLearningMode ? "Total Points" : "Total Profit";
  const goalLabel = isLearningMode ? "Learning goal" : "Plan completed";
  const planTitle = isLearningMode ? "Weekly focus" : "Sales plan";
  const planDescription = isLearningMode
    ? "Consistency across quizzes, reading, and game sessions improves mastery over time."
    : "Percentage profit from total sales";
  const firstIndicator = isLearningMode
    ? "Open Learning Stats"
    : "Open Statistics";
  const secondIndicator = isLearningMode
    ? "Growth Percentage"
    : "Percentage Change";

  return (
    <Card className={className}>
      <CardContent className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="flex flex-col gap-7 lg:col-span-3">
            <span className="text-lg font-semibold">{mainTitle}</span>
            <div className="flex items-center gap-3">
              <Avatar className="size-10.5 rounded-lg">
                <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-sm font-semibold">
                  {isLearningMode ? "EDU" : "SC"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-medium">{profileName}</span>
                <span className="text-muted-foreground text-sm">
                  {profileSubtext}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {metricsData.map((metric, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-md border px-4 py-2">
                  <Avatar className="size-8.5 rounded-sm">
                    <AvatarFallback className="bg-primary/10 text-primary shrink-0 rounded-sm">
                      {metric.icon}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-sm font-medium">
                      {metric.title}
                    </span>
                    <span className="text-lg font-medium">{metric.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Card className="gap-4 py-4 shadow-none lg:col-span-2">
            <CardHeader className="gap-1">
              <CardTitle className="text-lg font-semibold">
                {isLearningMode ? "Performance split" : "Revenue goal"}
              </CardTitle>
            </CardHeader>

            <CardContent className="px-0">
              <ChartContainer
                config={revenueChartConfig}
                className="h-38.5 w-full">
                <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={revenueChartData}
                    dataKey="sales"
                    nameKey="month"
                    startAngle={300}
                    endAngle={660}
                    innerRadius={58}
                    outerRadius={75}
                    paddingAngle={2}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle">
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 12}
                                className="fill-card-foreground text-lg font-medium">
                                {donutValue}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 19}
                                className="fill-muted-foreground text-sm">
                                {donutLabel}
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>

            <CardFooter className="justify-between">
              <span className="text-xl">{goalLabel}</span>
              <span className="text-2xl font-medium">
                {salesPlanPercentage}%
              </span>
            </CardFooter>
          </Card>
        </div>
        <Card className="shadow-none">
          <CardContent className="grid gap-4 px-4 lg:grid-cols-5">
            <div className="flex flex-col justify-center gap-6">
              <span className="text-lg font-semibold">{planTitle}</span>
              <span className="max-lg:5xl text-6xl">
                {salesPlanPercentage}%
              </span>
              <span className="text-muted-foreground text-sm">
                {planDescription}
              </span>
            </div>
            <div className="flex flex-col gap-6 text-lg md:col-span-4">
              <span className="font-medium">Cohort analysis indicators</span>
              <span className="text-muted-foreground text-wrap">
                {isLearningMode
                  ? "Track how your learning habits evolve over time and use trends to keep your study pattern consistent."
                  : "Analyzes the behaviour of a group of users who joined a product/service at the same time. over a certain period."}
              </span>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <ChartNoAxesCombinedIcon className="size-6" />
                  <span className="text-lg font-medium">{firstIndicator}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CirclePercentIcon className="size-6" />
                  <span className="text-lg font-medium">{secondIndicator}</span>
                </div>
              </div>

              <ChartContainer
                config={salesChartConfig}
                className="h-7.75 w-full">
                <BarChart
                  accessibilityLayer
                  data={salesChartData}
                  margin={{
                    left: 0,
                    right: 0,
                  }}
                  maxBarSize={16}>
                  <Bar
                    dataKey="sales"
                    fill="var(--primary)"
                    background={{
                      fill: "color-mix(in oklab, var(--primary) 10%, transparent)",
                      radius: 12,
                    }}
                    radius={12}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default SalesMetricsCard;
