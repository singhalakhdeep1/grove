'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { MessageSquare, Pin, Lock, Plus, ArrowLeft, Eye } from 'lucide-react'
import { forumsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { ForumThread } from '@/types'

export default function ForumPage() {
    const { forumId } = useParams<{ forumId: string }>()
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    const { data: threads, isLoading } = useQuery({
        queryKey: ['forum-threads', forumId],
        queryFn: () => forumsApi.listThreads(forumId),
    })

    const createThread = useMutation({
        mutationFn: () => forumsApi.createThread(forumId, { title, content }),
        onSuccess: () => {
            toast.success('Thread created!')
            queryClient.invalidateQueries({ queryKey: ['forum-threads', forumId] })
            setShowCreateModal(false)
            setTitle('')
            setContent('')
        },
        onError: () => toast.error('Failed to create thread'),
    })

    const threadList: ForumThread[] = threads?.data ?? threads ?? []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/forums" className="p-2 hover:bg-accent rounded-md transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1>Forum</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">{threadList.length} threads</p>
                    </div>
                </div>
                {user && (
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" /> New Thread
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} className="p-4">
                            <div className="flex gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-1/2" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        </Card>
                    ))
                    : threadList.map((thread) => (
                        <Link key={thread.id} href={`/forums/threads/${thread.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                                <CardContent className="p-4 flex items-start gap-4">
                                    <Avatar name={thread.user?.name ?? 'User'} src={thread.user?.avatar} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                                                {thread.title}
                                            </h3>
                                            {thread.isPinned && <Pin className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />}
                                            {thread.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                                            {thread.content.slice(0, 120)}...
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>{thread.user?.name}</span>
                                            <span>{formatRelativeTime(thread.createdAt)}</span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3" />
                                                {thread._count?.posts ?? 0} replies
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {thread.viewCount}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
            </div>

            <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Thread" size="lg">
                <div className="space-y-4">
                    <Input
                        label="Thread Title"
                        placeholder="What's your question or topic?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Textarea
                        label="Content"
                        placeholder="Provide more details..."
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        <Button
                            onClick={() => createThread.mutate()}
                            loading={createThread.isPending}
                            disabled={!title.trim() || !content.trim()}
                        >
                            Post Thread
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
