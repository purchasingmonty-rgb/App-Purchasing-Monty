import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  trendLabel?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-muted">{label}</p>
          <p className="figure mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
      {trendLabel && (
        <p
          className={cn(
            "mt-3 text-xs font-medium",
            trend === "up" ? "text-success" : "text-danger"
          )}
        >
          {trend === "up" ? "↑" : "↓"} {trendLabel}
        </p>
      )}
    </Card>
  );
}
