/**
 * License & branding re-export.
 *
 * Prefer importing from `@/config/app` in new code. This module exists
 * so teams looking for "license config" land on the same single source
 * of truth (`APP_CONFIG`).
 */
export {
  APP_CONFIG,
  getCurrentPlan,
  getWebsiteHost,
  parseConfigDate,
  type AppConfig,
  type LicenseConfig,
  type LicenseStatus,
  type PlanDefinition,
} from "./app";
