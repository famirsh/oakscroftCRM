/**
 * Oakscroft CRM — single source of truth for branding, license, and plans.
 *
 * Change plan price, install date, support email, or version HERE.
 * Dashboard, Settings, Footer, About, and future Billing all read from
 * this file (and optional NEXT_PUBLIC_* env overrides). No need to hunt
 * through components for hard-coded strings.
 *
 * Env overrides (optional):
 *   NEXT_PUBLIC_APP_INSTALL_DATE=2026-07-28
 *   NEXT_PUBLIC_APP_VERSION=1.0.0
 *   NEXT_PUBLIC_LICENSE_PLAN_ID=starter
 *   NEXT_PUBLIC_LICENSE_STATUS=active
 */

/** Machine status codes — UI maps these to labels without layout changes. */
export type LicenseStatus = "active" | "expired" | "suspended" | "trial";

/** Catalog entry for a billable plan. Add new plans here for future tiers. */
export interface PlanDefinition {
  id: string;
  name: string;
  /** Monthly list price in the license currency (display only). */
  monthlyPrice: number;
  /** Billing cycle length in whole calendar days. */
  durationDays: number;
  /** Short marketing blurb for future plan-picker UIs. */
  description?: string;
}

export interface LicenseConfig {
  /**
   * Id of the active plan — must match a key in `APP_CONFIG.plans`.
   * Swap to `"professional"` etc. without touching UI components.
   */
  planId: string;
  /**
   * Installation / license start date as `YYYY-MM-DD`.
   * Remaining days, renewal date, and billing cycle are derived from this.
   * Prefer env: `NEXT_PUBLIC_APP_INSTALL_DATE`.
   */
  installDate: string;
  /** Current license state. UI supports all four without redesign. */
  status: LicenseStatus;
  /** ISO-4217 currency code for price display. */
  currency: string;
  /** Currency symbol used in compact UI (₹, $, …). */
  currencySymbol: string;
}

export interface AppConfig {
  appName: string;
  company: string;
  companyFull: string;
  version: string;
  /** Product last-updated date (`YYYY-MM-DD`) for About / System Info. */
  lastUpdated: string;
  website: string;
  supportEmail: string;
  /** Tagline used on About cards. */
  tagline: string;
  /** Plan catalog — current plan is selected via `license.planId`. */
  plans: Record<string, PlanDefinition>;
  license: LicenseConfig;
  system: {
    database: string;
    storage: string;
    runtime: string;
    /**
     * Node version label for System Info.
     * Prefer `NEXT_PUBLIC_NODE_VERSION` at build/deploy time
     * (e.g. from `node -v` in CI). Falls back to a host placeholder.
     */
    nodeVersion: string;
  };
}

/**
 * Master application configuration.
 * Edit this object (or env vars) to rebrand / reprice / relicense.
 */
export const APP_CONFIG: AppConfig = {
  appName: "Oakscroft CRM",
  company: "Oakscroft",
  companyFull: "Oakscroft Technologies",
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
  lastUpdated: "2026-07-28",
  website: "https://oakscroft.org",
  supportEmail: "support@oakscroft.org",
  tagline:
    "Oakscroft CRM helps businesses manage WhatsApp conversations, customers, pipelines, broadcasts and automations from one modern platform.",

  plans: {
    starter: {
      id: "starter",
      name: "Starter",
      monthlyPrice: 2999,
      durationDays: 30,
      description: "Core inbox, contacts, pipelines, and broadcasts.",
    },
    professional: {
      id: "professional",
      name: "Professional",
      monthlyPrice: 4999,
      durationDays: 30,
      description: "Everything in Starter plus advanced automations and AI.",
    },
    enterprise: {
      id: "enterprise",
      name: "Enterprise",
      monthlyPrice: 9999,
      durationDays: 30,
      description: "Dedicated support, SSO, and custom limits.",
    },
  },

  license: {
    planId: process.env.NEXT_PUBLIC_LICENSE_PLAN_ID ?? "starter",
    installDate:
      process.env.NEXT_PUBLIC_APP_INSTALL_DATE ?? "2026-07-28",
    status: parseLicenseStatus(
      process.env.NEXT_PUBLIC_LICENSE_STATUS ?? "active",
    ),
    currency: "INR",
    currencySymbol: "₹",
  },

  system: {
    database: "Supabase (PostgreSQL)",
    storage: "Supabase Storage",
    runtime: "Next.js",
    nodeVersion:
      process.env.NEXT_PUBLIC_NODE_VERSION ??
      (typeof process !== "undefined" && process.versions?.node
        ? `v${process.versions.node}`
        : "Host runtime"),
  },
};

function parseLicenseStatus(raw: string): LicenseStatus {
  const v = raw.toLowerCase().trim();
  if (v === "expired" || v === "suspended" || v === "trial" || v === "active") {
    return v;
  }
  return "active";
}

/** Resolve the active plan definition from `license.planId`. */
export function getCurrentPlan(
  config: AppConfig = APP_CONFIG,
): PlanDefinition {
  const plan = config.plans[config.license.planId];
  if (plan) return plan;
  // Fallback to first catalog entry so a bad planId never crashes the UI.
  const first = Object.values(config.plans)[0];
  return (
    first ?? {
      id: "starter",
      name: "Starter",
      monthlyPrice: 0,
      durationDays: 30,
    }
  );
}

/** Parse `YYYY-MM-DD` into a local-midnight Date. */
export function parseConfigDate(isoDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) {
    // Last-resort: Date parse; still local when possible.
    const d = new Date(isoDate);
    if (!Number.isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return new Date(2026, 6, 28);
  }
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  return new Date(year, month, day);
}

/** Website hostname for compact display (e.g. oakscroft.org). */
export function getWebsiteHost(config: AppConfig = APP_CONFIG): string {
  try {
    return new URL(config.website).host.replace(/^www\./, "");
  } catch {
    return config.website.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}
