"use client"

import Link from 'next/link'
import { UserPlus, Briefcase, Radio, Zap } from 'lucide-react'
import type { ComponentType } from 'react'

import { useTranslations } from 'next-intl'

// Quick-action shortcuts. Each navigates to the page that owns the
// relevant "create" flow. We deliberately don't try to auto-open any
// modal on the target page — that'd require touching those pages,
// which is out of scope here.
interface Action {
  labelKey: string
  href: string
  icon: ComponentType<{ className?: string }>
  tint: string
  soft: string
}

const ACTIONS: Action[] = [
  {
    labelKey: 'newContact',
    href: '/contacts',
    icon: UserPlus,
    tint: 'text-primary',
    soft: 'bg-primary/10 ring-primary/15',
  },
  {
    labelKey: 'newDeal',
    href: '/pipelines',
    icon: Briefcase,
    tint: 'text-blue-400',
    soft: 'bg-blue-500/10 ring-blue-500/15',
  },
  {
    labelKey: 'newBroadcast',
    href: '/broadcasts/new',
    icon: Radio,
    tint: 'text-amber-400',
    soft: 'bg-amber-500/10 ring-amber-500/15',
  },
  {
    labelKey: 'newAutomation',
    href: '/automations/new',
    icon: Zap,
    tint: 'text-primary',
    soft: 'bg-primary/10 ring-primary/15',
  },
]

export function QuickActions() {
  const t = useTranslations('Dashboard.quickActions')

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-muted/40 hover:shadow-md hover:shadow-black/5"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-200 group-hover:scale-105 ${a.soft} ${a.tint}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium leading-snug text-foreground">
              {t(a.labelKey as string)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
