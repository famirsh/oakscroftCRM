"use client";

import { ArrowUpRight, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SettingsPanelHead } from "./settings-panel-head";

/**
 * Settings → Subscription — cosmetic plan summary only.
 * Upgrade / Renew buttons are UI-only (toast), no payment backend.
 */
export function SubscriptionPanel() {
  const t = useTranslations("Settings.subscription");

  return (
    <div className="space-y-6">
      <SettingsPanelHead title={t("title")} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("currentPlan")}
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                Starter
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="text-2xl font-bold text-foreground tabular-nums">
                  ₹2,999
                </span>{" "}
                {t("perMonth")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              {t("licenseActive")}
            </span>
          </div>
        </div>

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
      </div>
    </div>
  );
}
