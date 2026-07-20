import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-bg-subtle text-ink-muted",
  primary: "bg-primary-soft text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, BadgeTone> = {
  draft: "neutral",
  open: "primary",
  partial: "warning",
  completed: "success",
  cancelled: "danger",
  active: "success",
  inactive: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Berjalan",
  partial: "Sebagian",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  active: "Aktif",
  inactive: "Nonaktif",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? "neutral"}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
