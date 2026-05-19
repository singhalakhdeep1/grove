'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps {
    value: number
    max?: number
    className?: string
    showLabel?: boolean
    color?: 'default' | 'success' | 'warning' | 'destructive'
}

export function Progress({ value, max = 100, className, showLabel, color = 'default' }: ProgressProps) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100))
    const colors = {
        default: 'bg-primary',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        destructive: 'bg-destructive',
    }
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                    className={cn('h-full rounded-full transition-all duration-300', colors[color])}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {showLabel && <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(pct)}%</span>}
        </div>
    )
}
