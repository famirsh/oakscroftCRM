"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Globe,
  Mail,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  APP_CONFIG,
  getWebsiteHost,
  parseConfigDate,
} from "@/config/app";
import { cn } from "@/lib/utils";
import {
  formatSubscriptionDate,
  getSubscriptionInfo,
  type SubscriptionInfo,
} from "@/lib/subscription";
import { LicenseStatusBadge } from "@/components/subscription/license-status-badge";

/**
 * About Oakscroft CRM — product + license metadata from APP_CONFIG.
 */
export function AboutCard({ className }: { className?: string }) {
  const t = useTranslations("Dashboard.about");
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    setInfo(getSubscriptionInfo());
  }, []);

  const plan = info ?? getSubscriptionInfo();
  const websiteHost = getWebsiteHost();
  const lastUpdated = formatSubscriptionDate(
    parseConfigDate(APP_CONFIG.lastUpdated),
  );

  return (
    <section
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/10",
        className,
      )}
    >
      <header>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          {t("title", { appName: APP_CONFIG.appName })}
        </h2>
      </header>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {APP_CONFIG.tagline}
      </p>

      <ul className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <InfoRow
          icon={Package}
          label={t("currentVersion")}
          value={APP_CONFIG.version}
        />
        <InfoRow
          icon={Sparkles}
          label={t("currentPlan")}
          value={plan.planName}
        />
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t("licenseStatus")}
            </p>
            <div className="mt-0.5">
              <LicenseStatusBadge status={plan.status} size="sm" />
            </div>
          </div>
        </li>
        <InfoRow
          icon={CalendarDays}
          label={t("installedOn")}
          value={formatSubscriptionDate(plan.installedDate)}
        />
        <InfoRow
          icon={CalendarDays}
          label={t("lastUpdated")}
          value={lastUpdated}
        />
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t("support")}
            </p>
            <a
              href={`mailto:${APP_CONFIG.supportEmail}`}
              className="truncate font-medium text-foreground transition-colors hover:text-primary"
            >
              {APP_CONFIG.supportEmail}
            </a>
          </div>
        </li>
        <li className="flex items-center gap-3 sm:col-span-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t("website")}
            </p>
            <a
              href={APP_CONFIG.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
            >
              {websiteHost}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          </div>
        </li>
      </ul>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground tabular-nums">{value}</p>
      </div>
    </li>
  );
}
