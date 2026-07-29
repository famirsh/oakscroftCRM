import { cn } from '@/lib/utils'

/**
 * Shared skeleton primitive — a pulsing slate block sized to whatever
 * container it's dropped into. Used by every dashboard widget while
 * its data fetches.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-2.5 h-3 w-24" />
    </div>
  )
}
