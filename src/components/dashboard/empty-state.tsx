import { BarChart3 } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'

import { useTranslations } from 'next-intl'

/**
 * Shared empty-state panel for charts that can't render meaningfully
 * without a minimum amount of data. Kept minimal and uniform so the
 * three empty states on the dashboard don't each feel like a
 * different widget.
 */
export function EmptyState({
  title,
  hint,
  icon: Icon = BarChart3,
  className,
}: {
  title?: string
  hint?: string
  icon?: ComponentType<{ className?: string }>
  className?: string
}) {
  const t = useTranslations('Dashboard.emptyState')
  const defaultTitle = t('title')

  return (
    <div
      className={cn(
        'relative flex h-full min-h-44 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-border/80 bg-gradient-to-b from-muted/30 to-transparent px-6 py-8 text-center',
        className,
      )}
    >
      {/* Soft radial glow behind the icon */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary-soft),transparent_65%)] opacity-60"
      />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-sm ring-1 ring-border">
        <div className="absolute inset-0 rounded-2xl bg-primary/5" />
        <Icon className="relative h-5 w-5 text-primary/80" />
      </div>
      <div className="relative space-y-1">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {title || defaultTitle}
        </p>
        {hint && (
          <p className="mx-auto max-w-[18rem] text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
