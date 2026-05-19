'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    BookOpen,
    LayoutDashboard,
    MessageSquare,
    Trophy,
    Video,
    Users,
    Award,
    BarChart3,
    UserCheck,
    MessageCircle,
    GraduationCap,
    Settings,
    LogOut,
    ChevronLeft,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Courses', href: '/courses', icon: BookOpen },
    { label: 'Live Sessions', href: '/live-sessions', icon: Video },
    { label: 'Forums', href: '/forums', icon: MessageSquare },
    { label: 'Study Groups', href: '/study-groups', icon: Users },
    { label: 'Mentorship', href: '/mentorship', icon: UserCheck },
    { label: 'Messages', href: '/messaging', icon: MessageCircle },
    { label: 'Gamification', href: '/gamification', icon: Trophy },
    { label: 'Certifications', href: '/certifications', icon: Award },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                'flex flex-col h-full border-r border-border bg-card transition-all duration-200',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className={cn('flex items-center px-4 py-5 border-b border-border', collapsed ? 'justify-center' : 'justify-between')}>
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <GraduationCap className="h-7 w-7 text-primary" />
                        <span className="text-xl font-bold text-primary">Grove</span>
                    </Link>
                )}
                {collapsed && <GraduationCap className="h-7 w-7 text-primary" />}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
                </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 py-4 overflow-y-auto">
                {navItems.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={collapsed ? label : undefined}
                            className={cn(
                                'flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-md text-sm transition-colors group',
                                active
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                collapsed && 'justify-center px-0'
                            )}
                        >
                            <Icon className={cn('h-5 w-5 flex-shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                            {!collapsed && <span>{label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* User + settings */}
            {user && (
                <div className={cn('border-t border-border p-4', collapsed && 'flex flex-col items-center gap-2 px-2')}>
                    {!collapsed && (
                        <div className="flex items-center gap-3 mb-3">
                            <Avatar name={user.name} src={user.avatar} size="sm" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                            </div>
                        </div>
                    )}
                    <div className={cn('flex gap-2', collapsed && 'flex-col')}>
                        <Link
                            href="/settings"
                            className={cn(
                                'flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md px-2 py-1.5 transition-colors',
                                collapsed && 'justify-center p-2'
                            )}
                            title={collapsed ? 'Settings' : undefined}
                        >
                            <Settings className="h-4 w-4" />
                            {!collapsed && 'Settings'}
                        </Link>
                        <button
                            onClick={() => logout()}
                            className={cn(
                                'flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md px-2 py-1.5 transition-colors',
                                collapsed && 'justify-center p-2'
                            )}
                            title={collapsed ? 'Logout' : undefined}
                        >
                            <LogOut className="h-4 w-4" />
                            {!collapsed && 'Logout'}
                        </button>
                    </div>
                </div>
            )}
        </aside>
    )
}
