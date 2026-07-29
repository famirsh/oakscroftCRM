/**
 * Lightweight branding constants for chrome UI (footer, about card).
 * Not a licensing system — display-only product metadata.
 */
export const APP_BRAND = {
  appName: "Oakscroft CRM",
  company: "Oakscroft",
  companyFull: "Oakscroft Technologies",
  version: "1.0.0",
  website: "https://oakscroft.org",
  supportEmail: "support@oakscroft.org",
  tagline:
    "Oakscroft CRM helps businesses manage WhatsApp conversations, customers, pipelines, broadcasts and automations from one modern platform.",
} as const;

/** @deprecated Prefer APP_BRAND — kept so older imports keep working. */
export const APP_CONFIG = APP_BRAND;

export function getWebsiteHost(website: string = APP_BRAND.website): string {
  try {
    return new URL(website).host.replace(/^www\./, "");
  } catch {
    return website.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}
