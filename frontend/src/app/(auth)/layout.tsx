'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (isAuthenticated) router.replace('/dashboard')
    }, [isAuthenticated, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-grove-50 via-white to-grove-100 dark:from-background dark:via-background dark:to-muted p-4">
            <div className="w-full max-w-md">{children}</div>
        </div>
    )
}
