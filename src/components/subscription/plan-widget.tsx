"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatPlanPrice,
  formatSubscriptionDate,
  getSubscriptionInfo,
  type SubscriptionInfo,
  type SubscriptionTone,
} from "@/lib/subscription";
import { LicenseStatusBadge } from "./license-status-badge";

const TONE_BAR: Record<SubscriptionTone, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
};

const TONE_TEXT: Record<SubscriptionTone, string> = {
  green: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-rose-400",
};

export type PlanWidgetVariant = "card" | "panel" | "compact";

interface PlanWidgetProps {
  className?: string;
  /**
   * `card` — dashboard tile with manage CTA
   * `panel` — settings full panel with upgrade/renew
   * `compact` — dense summary for admin/overview embeds
   */
  variant?: PlanWidgetVariant;
  /** Show manage / upgrade / renew actions (default true for card/panel). */
  showActions?: boolean;
}

/**
 * Reusable plan / license widget.
 * Reads plan name, price, duration, and install date from APP_CONFIG
 * via getSubscriptionInfo() — never hard-codes Starter / ₹2999 / 30.
 * Safe to embed on Dashboard, Settings, future Billing, Admin overview.
 */
export function PlanWidget({
  className,
  variant = "card",
  showActions,
}: PlanWidgetProps) {
  const t = useTranslations("PlanWidget");
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    setInfo(getSubscriptionInfo());
  }, []);

  const plan = info ?? getSubscriptionInfo();
  const actions = showActions ?? variant !== "compact";

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-4 shadow-sm",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {t("currentPlan")}
            </p>
            <p className="mt-0.5 text-base font-semibold text-foreground">
              {plan.planName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">
                {formatPlanPrice(plan.monthlyPrice, plan.currencySymbol)}
              </span>
              {t("perMonth")}
            </p>
          </div>
          <LicenseStatusBadge status={plan.status} size="sm" />
        </div>
        <p className={cn("mt-3 text-xs font-semibold tabular-nums", TONE_TEXT[plan.tone])}>
          {t("daysRemaining", { count: plan.remainingDays })}
        </p>
      </div>
    );
  }

  if (variant === "panel") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
          className,
        )}
      >
        <div className="border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("currentPlan")}
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                {plan.planName}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="text-2xl font-bold text-foreground tabular-nums">
                  {formatPlanPrice(plan.monthlyPrice, plan.currencySymbol)}
                </span>{" "}
                {t("perMonth")}
              </p>
            </div>
            <LicenseStatusBadge status={plan.status} />
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetaTile
            icon={CalendarDays}
            label={t("installed")}
            value={formatSubscriptionDate(plan.installedDate)}
          />
          <MetaTile
            icon={CreditCard}
            label={t("renewal")}
            value={formatSubscriptionDate(plan.renewalDate)}
          />
          <MetaTile
            icon={RefreshCw}
            label={t("remaining")}
            value={t("daysRemaining", { count: plan.remainingDays })}
            valueClassName={TONE_TEXT[plan.tone]}
          />
          <MetaTile
            icon={Sparkles}
            label={t("billingCycle")}
            value={t("cycleNumber", {
              number: plan.cycleNumber,
              days: plan.durationDays,
            })}
          />
        </div>

        <div className="px-6 pb-6">
          <ProgressBlock plan={plan} t={t} />
        </div>

        {actions && (
          <div className="flex flex-wrap gap-3 border-t border-border bg-muted/30 px-6 py-4">
            <Button
              type="button"
              onClick={() => toast.message(t("upgradeToast"))}
              className="gap-1.5"
            >
              <ArrowUpRight className="h-4 w-4" />
              {t("upgrade")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.message(t("renewToast"))}
              className="gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              {t("renew")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Default: dashboard card
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
            {plan.planName}
          </h2>
        </div>
        <LicenseStatusBadge status={plan.status} size="sm" />
      </header>

      <div className="relative mt-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {formatPlanPrice(plan.monthlyPrice, plan.currencySymbol)}
        </span>
        <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
      </div>

      <dl className="relative mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-muted/50 px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {t("installed")}
          </dt>
          <dd className="mt-0.5 font-medium text-foreground tabular-nums">
            {formatSubscriptionDate(plan.installedDate)}
          </dd>
        </div>
        <div className="rounded-xl bg-muted/50 px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <CreditCard className="h-3 w-3" />
            {t("renewal")}
          </dt>
          <dd className="mt-0.5 font-medium text-foreground tabular-nums">
            {formatSubscriptionDate(plan.renewalDate)}
          </dd>
        </div>
      </dl>

      <div className="relative mt-5 flex-1">
        <ProgressBlock plan={plan} t={t} />
      </div>

      {actions && (
        <div className="relative mt-5 flex gap-2">
          <Link
            href="/settings?tab=subscription"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("manage")}
          </Link>
        </div>
      )}
    </section>
  );
}

function ProgressBlock({
  plan,
  t,
}: {
  plan: SubscriptionInfo;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className={cn("font-semibold tabular-nums", TONE_TEXT[plan.tone])}>
          {t("daysRemaining", { count: plan.remainingDays })}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {t("ofCycle", { days: plan.durationDays })}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={plan.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("daysRemaining", { count: plan.remainingDays })}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            TONE_BAR[plan.tone],
          )}
          style={{ width: `${plan.progressPercent}%` }}
        />
      </div>
    </>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold text-foreground tabular-nums",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** @deprecated Use PlanWidget — kept as alias for existing imports. */
export { PlanWidget as SubscriptionCard };
