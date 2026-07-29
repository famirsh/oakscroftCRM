/**
 * Subscription / plan display helpers — UI only.
 *
 * All plan metadata (name, price, duration, install date, status) comes
 * from `APP_CONFIG` in `src/config/app.ts`. This module only computes
 * derived values: remaining days, renewal date, current billing cycle,
 * progress, and tone.
 */

import {
  APP_CONFIG,
  getCurrentPlan,
  parseConfigDate,
  type LicenseStatus,
  type PlanDefinition,
} from "@/config/app";

export type SubscriptionTone = "green" | "amber" | "red";

export interface SubscriptionInfo {
  /** Active plan definition (from catalog via license.planId). */
  plan: PlanDefinition;
  /** Convenience: plan display name. */
  planName: string;
  /** Monthly price in license currency units. */
  monthlyPrice: number;
  /** Currency symbol for display (e.g. ₹). */
  currencySymbol: string;
  /** ISO currency code. */
  currency: string;
  /** Configured license status machine value. */
  status: LicenseStatus;
  /** Original installation date (start of first cycle). */
  installedDate: Date;
  /** Start of the current billing cycle. */
  cycleStart: Date;
  /** 1-based index of the current billing cycle since install. */
  cycleNumber: number;
  /** End of the current cycle (renewal calendar day). */
  renewalDate: Date;
  /** Whole calendar days remaining until renewal (0 when expired). */
  remainingDays: number;
  /** Cycle length in days (from plan config). */
  durationDays: number;
  /** 0–100 remaining capacity of the current cycle. */
  progressPercent: number;
  /** Progress-bar / emphasis colour based on remaining days. */
  tone: SubscriptionTone;
}

/** Strip time so day-math is timezone-stable within a locale. */
function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Add whole calendar days to a date (local). */
function addCalendarDays(d: Date, days: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Whole calendar days from `from` to `to` (can be negative).
 */
export function calendarDaysBetween(from: Date, to: Date): number {
  const a = startOfLocalDay(from);
  const b = startOfLocalDay(to);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86_400_000);
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Format a date like "28 Jul 2026" for subscription surfaces.
 * Fixed month table avoids locale drift (Sept vs Sep).
 */
export function formatSubscriptionDate(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format a monthly price with the configured currency symbol. */
export function formatPlanPrice(
  amount: number,
  symbol: string = APP_CONFIG.license.currencySymbol,
): string {
  return `${symbol}${amount.toLocaleString("en-IN")}`;
}

/**
 * Compute live subscription display values.
 *
 * Install date, plan, and duration come from `APP_CONFIG` (or optional
 * overrides). Remaining days and renewal are always calculated — never
 * hard-coded.
 */
export function getSubscriptionInfo(
  asOf: Date = new Date(),
  options?: {
    installDate?: Date | string;
    plan?: PlanDefinition;
    status?: LicenseStatus;
  },
): SubscriptionInfo {
  const plan = options?.plan ?? getCurrentPlan();
  const durationDays = Math.max(1, plan.durationDays);
  const installRaw =
    options?.installDate ?? APP_CONFIG.license.installDate;
  const install = startOfLocalDay(
    typeof installRaw === "string" ? parseConfigDate(installRaw) : installRaw,
  );
  const today = startOfLocalDay(asOf);
  const status = options?.status ?? APP_CONFIG.license.status;

  const daysSinceInstall = Math.max(0, calendarDaysBetween(install, today));
  const cycleIndex = Math.floor(daysSinceInstall / durationDays);
  const cycleStart = addCalendarDays(install, cycleIndex * durationDays);
  const renewalDate = addCalendarDays(cycleStart, durationDays);
  const remainingDays = Math.max(0, calendarDaysBetween(today, renewalDate));

  // Progress bar = remaining capacity (shrinks as renewal approaches).
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((remainingDays / durationDays) * 100)),
  );

  let tone: SubscriptionTone = "green";
  if (status === "expired" || remainingDays <= 3) tone = "red";
  else if (status === "suspended" || remainingDays <= 7) tone = "amber";
  else if (status === "trial") tone = remainingDays <= 7 ? "amber" : "green";

  return {
    plan,
    planName: plan.name,
    monthlyPrice: plan.monthlyPrice,
    currencySymbol: APP_CONFIG.license.currencySymbol,
    currency: APP_CONFIG.license.currency,
    status,
    installedDate: install,
    cycleStart,
    cycleNumber: cycleIndex + 1,
    renewalDate,
    remainingDays,
    durationDays,
    progressPercent,
    tone,
  };
}

/** Whether the expiry / renew banner should surface (≤7 days left). */
export function shouldShowExpiryBanner(info?: SubscriptionInfo): boolean {
  const data = info ?? getSubscriptionInfo();
  if (data.status === "suspended") return true;
  if (data.status === "expired") return true;
  return data.remainingDays <= 7;
}
