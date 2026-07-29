"use client";

import { ExternalLink, Globe, Mail, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { APP_BRAND, getWebsiteHost } from "@/config/app";
import { cn } from "@/lib/utils";

/**
 * Static product info card — no license / install-date logic.
 */
export function AboutCard({ className }: { className?: string }) {
  const t = useTranslations("Dashboard.about");
  const websiteHost = getWebsiteHost();

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
          {t("title", { appName: APP_BRAND.appName })}
        </h2>
      </header>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {APP_BRAND.tagline}
      </p>

      <ul className="mt-5 space-y-3 text-sm">
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t("version")}
            </p>
            <p className="font-medium text-foreground tabular-nums">
              {APP_BRAND.version}
            </p>
          </div>
        </li>
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t("support")}
            </p>
            <a
              href={`mailto:${APP_BRAND.supportEmail}`}
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              {APP_BRAND.supportEmail}
            </a>
          </div>
        </li>
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t("website")}
            </p>
            <a
              href={APP_BRAND.website}
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
