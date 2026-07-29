"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  getSubscriptionInfo,
  shouldShowExpiryBanner,
  type SubscriptionInfo,
} from "@/lib/subscription";

const DISMISS_KEY = "oakscroft_expiry_banner_dismissed";

/**
 * Top-of-app banner when the license is within 7 days of renewal
 * (or expired / suspended). Professional SaaS pattern — dismissible
 * for the current session day.
 */
export function ExpiryBanner() {
  const t = useTranslations("ExpiryBanner");
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const data = getSubscriptionInfo();
    setInfo(data);
    if (!shouldShowExpiryBanner(data)) {
      setDismissed(true);
      return;
    }
    try {
      const raw = sessionStorage.getItem(DISMISS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { day?: string; days?: number };
        const today = new Date().toISOString().slice(0, 10);
        // Re-show if remaining days changed or it's a new day.
        if (parsed.day === today && parsed.days === data.remainingDays) {
          setDismissed(true);
          return;
        }
      }
    } catch {
      // ignore storage errors
    }
    setDismissed(false);
  }, []);

  if (!info || dismissed || !shouldShowExpiryBanner(info)) return null;

  const isExpired = info.status === "expired" || info.remainingDays <= 0;
  const isSuspended = info.status === "suspended";

  const message = isSuspended
    ? t("suspended", { plan: info.planName })
    : isExpired
      ? t("expired", { plan: info.planName })
      : t("expiresIn", { plan: info.planName, count: info.remainingDays });

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(
        DISMISS_KEY,
        JSON.stringify({
          day: new Date().toISOString().slice(0, 10),
          days: info.remainingDays,
        }),
      );
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="status"
      className={cn(
        "flex shrink-0 items-center gap-3 border-b px-4 py-2.5 sm:px-6",
        isExpired || isSuspended
          ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
          : "border-amber-500/30 bg-amber-500/10 text-amber-100",
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      <p className="min-w-0 flex-1 text-sm font-medium leading-snug">
        {message}{" "}
        <Link
          href="/settings?tab=subscription"
          className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          {t("renewNow")}
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
