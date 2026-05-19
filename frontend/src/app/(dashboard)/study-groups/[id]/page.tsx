'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Users, Send, Lock, Globe } from 'lucide-react'
import Link from 'next/link'
import { studyGroupsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { StudyGroupPost } from '@/types'

export default function StudyGroupDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const [newPost, setNewPost] = useState('')

    const { data: group, isLoading } = useQuery({
        queryKey: ['study-group', id],
        queryFn: () => studyGroupsApi.get(id),
    })

    const { data: postsData } = useQuery({
        queryKey: ['study-group-posts', id],
        queryFn: () => studyGroupsApi.getPosts(id),
        enabled: !!id,
    })

    const createPost = useMutation({
        mutationFn: () => studyGroupsApi.createPost(id, { content: newPost }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['study-group-posts', id] })
            setNewPost('')
        },
        onError: () => toast.error('Failed to post'),
    })

    const posts: StudyGroupPost[] = postsData?.data ?? postsData ?? []

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-24" /></div>
    if (!group) return <div>Group not found</div>

    return (
        <div className="space-y-6 max-w-4xl">
            <Link href="/study-groups" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Study Groups
            </Link>

            {/* Group header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1>{group.name}</h1>
                                {group.isPrivate ? (
                                    <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Private</Badge>
                                ) : (
                                    <Badge variant="outline"><Globe className="h-3 w-3 mr-1" />Public</Badge>
                                )}
                            </div>
                            {group.description && <p className="text-muted-foreground mt-2">{group.description}</p>}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {group._count?.members ?? 0} members
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Post feed */}
            <div className="space-y-4">
                {/* New post */}
                {group.isMember && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Avatar name={user?.name ?? 'You'} src={user?.avatar} />
                                <div className="flex-1">
                                    <textarea
                                        placeholder="Share something with the group..."
                                        className="input w-full resize-none"
                                        rows={3}
                                        value={newPost}
                                        onChange={(e) => setNewPost(e.target.value)}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <Button
                                            size="sm"
                                            onClick={() => createPost.mutate()}
                                            loading={createPost.isPending}
                                            disabled={!newPost.trim()}
                                        >
                                            <Send className="h-3.5 w-3.5 mr-1.5" /> Post
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {posts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        No posts yet. Be the first to share something!
                    </div>
                ) : (
                    posts.map((post) => (
                        <Card key={post.id}>
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <Avatar name={post.user?.name ?? 'User'} src={post.user?.avatar} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{post.user?.name}</span>
                                            <span className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
                                        </div>
                                        <p className="mt-2 text-sm leading-relaxed">{post.content}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
