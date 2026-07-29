"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import {
  Bell,
  LogOut,
  Menu,
  Search,
  Settings as SettingsIcon,
  User,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "dashboard",
  "/inbox": "inbox",
  "/notifications": "notifications",
  "/contacts": "contacts",
  "/pipelines": "pipelines",
  "/broadcasts": "broadcasts",
  "/automations": "automations",
  "/flows": "flows",
  "/agents": "agents",
  "/settings": "settings",
};

function getPageTitleKey(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path),
  );
  return match ? match[1] : "dashboard";
}

interface HeaderProps {
  /** Wired to the shell's drawer state. Used only on mobile — the
   *  hamburger button is hidden on lg+. */
  onOpenSidebar?: () => void;
  /** Opens the ⌘K command palette. */
  onOpenSearch?: () => void;
}

import { useTranslations } from "next-intl";

export function Header({ onOpenSidebar, onOpenSearch }: HeaderProps) {
  const t = useTranslations("Header");
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const unreadNotifications = useUnreadNotifications();
  const titleKey = getPageTitleKey(pathname);
  // Dashboard renders its own large page heading + welcome line, so
  // we skip the redundant title in the top bar on that route.
  const showPageTitle = pathname !== "/dashboard";

  const initial =
    profile?.full_name?.charAt(0)?.toUpperCase() ??
    profile?.email?.charAt(0)?.toUpperCase() ??
    "U";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Hamburger — mobile only. 44×44 hit target per Apple HIG. */}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label={t("openMenu")}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        {showPageTitle ? (
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {t(titleKey as string)}
          </h1>
        ) : (
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
            {t("workspace")}
          </span>
        )}

        {/* Quick search trigger — Linear / Notion style */}
        <button
          type="button"
          onClick={onOpenSearch}
          className={cn(
            "ml-auto hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150",
            "hover:bg-muted hover:text-foreground md:flex",
            "lg:ml-6 lg:min-w-[220px] lg:max-w-sm",
          )}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">{t("searchPlaceholder")}</span>
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Mobile search icon */}
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label={t("searchPlaceholder")}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          aria-label={
            unreadNotifications > 0
              ? t("notificationsUnread", { count: unreadNotifications })
              : t("notifications")
          }
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground",
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Link>

        {/* Theme toggle */}
        <ModeToggle className="rounded-lg" />

        {/* User avatar + menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="ml-0.5 flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors duration-150 hover:bg-muted/70 focus:bg-muted/70 focus:outline-none data-popup-open:bg-muted/70 sm:gap-2.5 sm:pl-1.5 sm:pr-2.5"
            aria-label={t("openAccountMenu")}
          >
            <Avatar className="size-8 ring-1 ring-border">
              {profile?.avatar_url ? (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.full_name ?? t("defaultAvatar")}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[10rem] truncate text-sm font-medium text-foreground sm:inline">
              {profile?.full_name ?? t("defaultUser")}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="min-w-56 bg-popover text-popover-foreground ring-border"
          >
            <div className="px-2 py-2">
              <p className="truncate text-sm font-medium text-foreground">
                {profile?.full_name ?? t("defaultUser")}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {profile?.email ?? ""}
              </p>
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              render={
                <Link
                  href="/settings?tab=profile"
                  className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                />
              }
            >
              <User className="size-4" />
              {t("menuProfile")}
            </DropdownMenuItem>
            <DropdownMenuItem
              render={
                <Link
                  href="/settings?tab=subscription"
                  className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                />
              }
            >
              <SettingsIcon className="size-4" />
              {t("menuSubscription")}
            </DropdownMenuItem>
            <DropdownMenuItem
              render={
                <Link
                  href="/settings?tab=whatsapp"
                  className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                />
              }
            >
              <SettingsIcon className="size-4" />
              {t("menuSettings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={signOut}
              className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <LogOut className="size-4" />
              {t("menuSignOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
