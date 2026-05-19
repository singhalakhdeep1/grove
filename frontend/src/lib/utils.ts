import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffSec < 60) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return formatDate(date)
}

export function formatPrice(price: number): string {
    if (price === 0) return 'Free'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str
    return str.slice(0, length) + '…'
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export function levelToColor(level: string): string {
    const map: Record<string, string> = {
        BEGINNER: 'text-green-600 bg-green-50',
        INTERMEDIATE: 'text-blue-600 bg-blue-50',
        ADVANCED: 'text-purple-600 bg-purple-50',
        EXPERT: 'text-red-600 bg-red-50',
    }
    return map[level] ?? 'text-gray-600 bg-gray-50'
}

export function getAvatarUrl(name: string, avatar?: string): string {
    if (avatar) return avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=16a34a&color=fff&bold=true`
}
