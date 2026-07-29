"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Cosmetic "Current Plan" card — static premium chrome only.
 * No license engine, remaining-day math, or payment integration.
 */
export function SubscriptionCard({ className }: { className?: string }) {
  const t = useTranslations("Dashboard.subscription");

  return (
    <section
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/10",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent"
      />

      <header className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("currentPlan")}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Starter
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
          {t("statusActive")}
        </span>
      </header>

      <div className="relative mt-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
          ₹2,999
        </span>
        <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
      </div>

      <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground">
        {t("blurb")}
      </p>

      <div className="relative mt-auto pt-5">
        <Link
          href="/settings?tab=subscription"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t("manage")}
        </Link>
      </div>
    </section>
  );
}
