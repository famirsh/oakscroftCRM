"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { LicenseStatus } from "@/config/app";
import type { SubscriptionTone } from "@/lib/subscription";

const STATUS_TONE: Record<LicenseStatus, SubscriptionTone> = {
  active: "green",
  trial: "green",
  suspended: "amber",
  expired: "red",
};

const TONE_SOFT: Record<SubscriptionTone, string> = {
  green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  red: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
};

const TONE_DOT: Record<SubscriptionTone, string> = {
  green: "bg-emerald-400",
  amber: "bg-amber-400",
  red: "bg-rose-400",
};

/**
 * License status chip — supports Active / Trial / Suspended / Expired
 * without layout changes. Status codes come from APP_CONFIG.
 */
export function LicenseStatusBadge({
  status,
  className,
  size = "default",
}: {
  status: LicenseStatus;
  className?: string;
  size?: "default" | "sm";
}) {
  const t = useTranslations("License.status");
  const tone = STATUS_TONE[status] ?? "green";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset",
        size === "sm"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-[11px]",
        TONE_SOFT[tone],
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[tone])}
        aria-hidden
      />
      {t(status)}
    </span>
  );
}
