'use client'

import * as React from 'react'
import { cn, getInitials, getAvatarUrl } from '@/lib/utils'
import Image from 'next/image'

interface AvatarProps {
    name: string
    src?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
    const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' }
    const px = { sm: 32, md: 40, lg: 48, xl: 64 }
    const imgSrc = src || getAvatarUrl(name)

    return (
        <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', sizes[size], className)}>
            <Image
                src={imgSrc}
                alt={name}
                width={px[size]}
                height={px[size]}
                className="object-cover w-full h-full"
                onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=16a34a&color=fff&bold=true`
                }}
            />
        </div>
    )
}

interface AvatarFallbackProps {
    name: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

export function AvatarFallback({ name, size = 'md', className }: AvatarFallbackProps) {
    const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' }
    return (
        <div
            className={cn(
                'rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0',
                sizes[size],
                className
            )}
        >
            {getInitials(name)}
        </div>
    )
}
