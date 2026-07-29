import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  /** Pre-formatted value for display (e.g. "42" or "$1,250"). */
  value: string
  icon: ComponentType<{ className?: string }>
  /**
   * Delta-mode secondary row: arrow + delta text. Omit when the metric
   * doesn't have a sensible comparison (e.g. total pipeline value).
   */
  delta?: {
    /** Positive / negative / zero drives arrow + color. */
    sign: number
    /** Pre-formatted delta, e.g. "+3 vs yesterday". */
    label: string
  }
  /** Used instead of `delta` when the metric has a static subtitle. */
  subtitle?: string
}

export function MetricCard({ title, value, icon: Icon, delta, subtitle }: MetricCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card p-5',
        'shadow-sm transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:border-border hover:shadow-md hover:shadow-black/10',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-snug text-muted-foreground">
          {title}
        </p>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            'bg-primary/10 text-primary ring-1 ring-inset ring-primary/10',
            'transition-transform duration-200 group-hover:scale-105',
          )}
        >
          <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        </div>
      </div>
      <p className="mt-4 text-[1.75rem] leading-none font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      {delta ? (
        <DeltaRow sign={delta.sign} label={delta.label} />
      ) : subtitle ? (
        <p className="mt-2.5 text-sm leading-snug text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  )
}

function DeltaRow({ sign, label }: { sign: number; label: string }) {
  const tone =
    sign > 0
      ? 'text-primary'
      : sign < 0
      ? 'text-red-400'
      : 'text-muted-foreground'
  const Arrow = sign > 0 ? ArrowUp : sign < 0 ? ArrowDown : Minus
  return (
    <div className={cn('mt-2.5 flex items-center gap-1 text-sm leading-snug', tone)}>
      <Arrow className="h-4 w-4 shrink-0" aria-hidden />
      <span className="tabular-nums">{label}</span>
    </div>
  )
}
