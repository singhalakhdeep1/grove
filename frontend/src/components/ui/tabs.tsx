'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
    tabs: { id: string; label: string; icon?: React.ReactNode }[]
    activeTab: string
    onChange: (id: string) => void
    className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
    return (
        <div className={cn('flex border-b border-border', className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                        activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    )}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

interface TabContentProps {
    id: string
    activeTab: string
    children: React.ReactNode
    className?: string
}

export function TabContent({ id, activeTab, children, className }: TabContentProps) {
    if (id !== activeTab) return null
    return <div className={cn('animate-fade-in', className)}>{children}</div>
}
