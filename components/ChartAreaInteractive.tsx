"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Dummy fallback data (can be replaced with props or Firestore data)
const chartData = [
  { date: "2024-08-01", visitors: 1200 },
  { date: "2024-08-02", visitors: 1900 },
  { date: "2024-08-03", visitors: 800 },
  { date: "2024-08-04", visitors: 1500 },
  { date: "2024-08-05", visitors: 2100 },
  { date: "2024-08-06", visitors: 1700 },
  { date: "2024-08-07", visitors: 2500 },
];

interface ChartAreaInteractiveProps {
  data?: { date: string; visitors: number }[];
  title?: string;
}

export function ChartAreaInteractive({
  data = chartData,
  title = "Visitor Traffic",
}: ChartAreaInteractiveProps) {
  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#3b82f6"
                fill="url(#visitorsGradient)"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChartAreaInteractive;