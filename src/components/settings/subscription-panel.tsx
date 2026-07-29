"use client";

import { useTranslations } from "next-intl";
import { PlanWidget } from "@/components/subscription/plan-widget";
import { APP_CONFIG } from "@/config/app";
import { SettingsPanelHead } from "./settings-panel-head";

/**
 * Settings → Subscription.
 * Reuses PlanWidget (panel variant) so Dashboard / Settings / future
 * Billing stay in sync. All plan data comes from APP_CONFIG.
 */
export function SubscriptionPanel() {
  const t = useTranslations("Settings.subscription");

  return (
    <div className="space-y-6">
      <SettingsPanelHead
        title={t("title")}
        description={t("description", { appName: APP_CONFIG.appName })}
      />
      <PlanWidget variant="panel" />
    </div>
  );
}
