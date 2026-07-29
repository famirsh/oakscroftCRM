"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Database,
  HardDrive,
  Monitor,
  Package,
  Server,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { APP_BRAND } from "@/config/app";
import { SettingsPanelHead } from "./settings-panel-head";

interface ClientFacts {
  timezone: string;
  environment: string;
  language: string;
}

/**
 * Settings → System information.
 * Timezone / locale / environment are read after mount only.
 */
export function SystemInfoPanel() {
  const t = useTranslations("Settings.system");
  const [facts, setFacts] = useState<ClientFacts | null>(null);

  useEffect(() => {
    setFacts({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "—",
      environment: process.env.NODE_ENV ?? "development",
      language: typeof navigator !== "undefined" ? navigator.language : "—",
    });
  }, []);

  const rows: { icon: typeof Package; label: string; value: string }[] = [
    {
      icon: Package,
      label: t("currentVersion"),
      value: APP_BRAND.version,
    },
    {
      icon: Server,
      label: t("runtime"),
      value: "Next.js",
    },
    {
      icon: Monitor,
      label: t("environment"),
      value: facts?.environment ?? "—",
    },
    {
      icon: Database,
      label: t("database"),
      value: "Supabase (PostgreSQL)",
    },
    {
      icon: HardDrive,
      label: t("storage"),
      value: "Supabase Storage",
    },
    {
      icon: Clock,
      label: t("timezone"),
      value: facts?.timezone ?? "—",
    },
    {
      icon: Monitor,
      label: t("locale"),
      value: facts?.language ?? "—",
    },
    {
      icon: Package,
      label: t("appName"),
      value: APP_BRAND.appName,
    },
  ];

  return (
    <div className="space-y-6">
      <SettingsPanelHead title={t("title")} description={t("description")} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <li
                key={row.label}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {row.label}
                  </p>
                  <p
                    className="truncate text-sm font-medium text-foreground tabular-nums"
                    suppressHydrationWarning
                  >
                    {row.value}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{t("note")}</p>
    </div>
  );
}
