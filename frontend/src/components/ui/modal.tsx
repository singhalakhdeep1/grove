'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
    open: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, description, children, className, size = 'md' }: ModalProps) {
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        if (open) document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={cn('relative bg-card rounded-lg shadow-xl w-full border border-border animate-fade-in', sizes[size], className)}>
                {(title || description) && (
                    <div className="p-6 pb-0">
                        {title && <h2 className="text-xl font-semibold">{title}</h2>}
                        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                    </div>
                )}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}
