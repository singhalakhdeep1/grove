'use client'

import { Bell, Search, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/avatar'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function Navbar() {
    const { user } = useAuthStore()
    const { theme, setTheme } = useTheme()
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/courses?search=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    return (
        <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 sticky top-0 z-40">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search courses, forums, groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted border border-transparent focus:border-ring focus:ring-2 focus:ring-ring/20 text-sm outline-none transition-all"
                    />
                </div>
            </form>

            <div className="flex items-center gap-2 ml-auto">
                {/* Theme toggle */}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {/* Notifications */}
                <Link
                    href="/notifications"
                    className="relative p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                </Link>

                {/* User avatar */}
                {user && (
                    <Link href="/profile" className="ml-1">
                        <Avatar name={user.name} src={user.avatar} size="sm" />
                    </Link>
                )}
            </div>
        </header>
    )
}
