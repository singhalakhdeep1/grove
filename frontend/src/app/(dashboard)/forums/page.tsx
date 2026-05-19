'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { MessageSquare, Pin, Lock, Eye, ChevronRight } from 'lucide-react'
import { forumsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Forum } from '@/types'

export default function ForumsPage() {
    const { data: forums, isLoading } = useQuery({
        queryKey: ['forums'],
        queryFn: forumsApi.listForums,
    })

    return (
        <div className="space-y-6">
            <div>
                <h1>Community Forums</h1>
                <p className="text-muted-foreground mt-1">Discuss, ask questions, and help each other learn</p>
            </div>

            <div className="grid gap-4">
                {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} className="p-4">
                            <div className="flex gap-4">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-1/3" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        </Card>
                    ))
                    : (forums as Forum[])?.map((forum) => (
                        <Link key={forum.id} href={`/forums/${forum.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold group-hover:text-primary transition-colors">{forum.title}</h3>
                                        {forum.description && (
                                            <p className="text-sm text-muted-foreground truncate mt-0.5">{forum.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-shrink-0">
                                        <span>{forum._count?.threads ?? 0} threads</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
            </div>
        </div>
    )
}
