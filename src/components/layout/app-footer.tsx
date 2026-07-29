"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { APP_BRAND } from "@/config/app";

/**
 * Minimal enterprise footer — static branding only.
 */
export function AppFooter() {
  const t = useTranslations("AppFooter");
  // Static year (cosmetic). Avoids Date.now() during SSR/hydration.
  const year = 2026;

  return (
    <footer className="shrink-0 border-t border-border bg-background/80 px-4 py-3.5 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-0.5 text-center sm:items-start sm:text-left">
          <p className="font-medium text-foreground/80">
            {APP_BRAND.appName}{" "}
            <span className="font-normal text-muted-foreground tabular-nums">
              v{APP_BRAND.version}
            </span>
          </p>
          <p>{t("poweredBy", { company: APP_BRAND.companyFull })}</p>
          <p className="tabular-nums">
            {t("copyright", {
              year,
              company: APP_BRAND.company,
            })}
          </p>
        </div>
        <nav
          aria-label={t("navLabel")}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        >
          <FooterLink href="#privacy">{t("privacy")}</FooterLink>
          <FooterLink href="#terms">{t("terms")}</FooterLink>
          <FooterLink href="#docs">{t("documentation")}</FooterLink>
        </nav>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="transition-colors hover:text-foreground">
      {children}
    </Link>
  );
}
