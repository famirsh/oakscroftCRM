"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  CreditCard,
  GitBranch,
  Info,
  LayoutDashboard,
  MessageSquare,
  Radio,
  Search,
  Settings,
  Users,
  Workflow,
  Zap,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string;
  group: string;
}

/**
 * Linear / Notion-style quick search (⌘K / Ctrl+K).
 * Pure client navigation — no backend search.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("CommandPalette");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items: CommandItem[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: t("dashboard"),
        href: "/dashboard",
        icon: LayoutDashboard,
        group: t("groupNavigate"),
        keywords: "home overview",
      },
      {
        id: "inbox",
        label: t("inbox"),
        href: "/inbox",
        icon: MessageSquare,
        group: t("groupNavigate"),
        keywords: "chat messages",
      },
      {
        id: "notifications",
        label: t("notifications"),
        href: "/notifications",
        icon: Bell,
        group: t("groupNavigate"),
      },
      {
        id: "contacts",
        label: t("contacts"),
        href: "/contacts",
        icon: Users,
        group: t("groupNavigate"),
      },
      {
        id: "pipelines",
        label: t("pipelines"),
        href: "/pipelines",
        icon: GitBranch,
        group: t("groupNavigate"),
        keywords: "deals sales",
      },
      {
        id: "broadcasts",
        label: t("broadcasts"),
        href: "/broadcasts",
        icon: Radio,
        group: t("groupNavigate"),
      },
      {
        id: "automations",
        label: t("automations"),
        href: "/automations",
        icon: Zap,
        group: t("groupNavigate"),
      },
      {
        id: "flows",
        label: t("flows"),
        href: "/flows",
        icon: Workflow,
        group: t("groupNavigate"),
      },
      {
        id: "agents",
        label: t("agents"),
        href: "/agents",
        icon: Bot,
        group: t("groupNavigate"),
        keywords: "ai",
      },
      {
        id: "settings",
        label: t("settings"),
        href: "/settings",
        icon: Settings,
        group: t("groupSettings"),
      },
      {
        id: "subscription",
        label: t("subscription"),
        href: "/settings?tab=subscription",
        icon: CreditCard,
        group: t("groupSettings"),
        keywords: "plan billing license",
      },
      {
        id: "system",
        label: t("systemInfo"),
        href: "/settings?tab=system",
        icon: Info,
        group: t("groupSettings"),
        keywords: "version environment",
      },
    ],
    [t],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = `${item.label} ${item.keywords ?? ""} ${item.group}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus after open animation
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const run = useCallback(
    (item: CommandItem) => {
      onOpenChange(false);
      router.push(item.href);
    },
    [onOpenChange, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) run(item);
    }
  };

  // Keep active row in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Group for display
  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return map;
  }, [filtered]);

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label={t("placeholder")}
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          className="max-h-[min(60vh,360px)] overflow-y-auto p-2"
          role="listbox"
          aria-label={t("results")}
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            Array.from(groups.entries()).map(([group, groupItems]) => (
              <div key={group} className="mb-1">
                <p className="px-2 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {group}
                </p>
                {groupItems.map((item) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  const Icon = item.icon;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-index={index}
                      onClick={() => run(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="flex-1 font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          <span>{t("hintNav")}</span>
          <span>{t("hintOpen")}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Global ⌘K / Ctrl+K listener + optional controlled open.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}
