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
import { APP_CONFIG } from "@/config/app";
import { SettingsPanelHead } from "./settings-panel-head";

interface RuntimeFacts {
  timezone: string;
  environment: string;
  language: string;
  /** Approximate storage estimate when the browser supports it. */
  storageLabel: string;
  userAgent: string;
}

/**
 * Settings → System Information.
 * Mix of APP_CONFIG constants and live browser/runtime facts.
 * No backend calls.
 */
export function SystemInfoPanel() {
  const t = useTranslations("Settings.system");
  const [facts, setFacts] = useState<RuntimeFacts | null>(null);

  useEffect(() => {
    let cancelled = false;

    const base: RuntimeFacts = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "—",
      environment: process.env.NODE_ENV ?? "development",
      language:
        typeof navigator !== "undefined" ? navigator.language : "—",
      storageLabel: APP_CONFIG.system.storage,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "—",
    };

    setFacts(base);

    // Optional Storage API estimate — purely informational.
    void (async () => {
      try {
        if (navigator.storage?.estimate) {
          const est = await navigator.storage.estimate();
          if (cancelled || !est.quota) return;
          const used = est.usage ?? 0;
          const quota = est.quota;
          const usedMb = (used / (1024 * 1024)).toFixed(1);
          const quotaMb = (quota / (1024 * 1024)).toFixed(0);
          setFacts((prev) =>
            prev
              ? {
                  ...prev,
                  storageLabel: `${APP_CONFIG.system.storage} · ~${usedMb} / ${quotaMb} MB local`,
                }
              : prev,
          );
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = [
    {
      icon: Package,
      label: t("currentVersion"),
      value: APP_CONFIG.version,
    },
    {
      icon: Server,
      label: t("nodeVersion"),
      value: APP_CONFIG.system.nodeVersion,
    },
    {
      icon: Server,
      label: t("runtime"),
      value: APP_CONFIG.system.runtime,
    },
    {
      icon: Monitor,
      label: t("environment"),
      value: facts?.environment ?? "—",
    },
    {
      icon: Database,
      label: t("database"),
      value: APP_CONFIG.system.database,
    },
    {
      icon: HardDrive,
      label: t("storage"),
      value: facts?.storageLabel ?? APP_CONFIG.system.storage,
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
      value: APP_CONFIG.appName,
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
                  <p className="truncate text-sm font-medium text-foreground tabular-nums">
                    {row.value}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("note")}
      </p>
    </div>
  );
}
