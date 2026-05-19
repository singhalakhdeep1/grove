'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, ThumbsUp, ThumbsDown, Award, Edit2, Trash2, Reply } from 'lucide-react'
import { forumsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { ForumPost } from '@/types'

export default function ThreadPage() {
    const { threadId } = useParams<{ threadId: string }>()
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const [replyContent, setReplyContent] = useState('')

    const { data: thread, isLoading } = useQuery({
        queryKey: ['forum-thread', threadId],
        queryFn: () => forumsApi.getThread(threadId),
    })

    const createPost = useMutation({
        mutationFn: () => forumsApi.createPost(threadId, { content: replyContent }),
        onSuccess: () => {
            toast.success('Reply posted!')
            queryClient.invalidateQueries({ queryKey: ['forum-thread', threadId] })
            setReplyContent('')
        },
        onError: () => toast.error('Failed to post reply'),
    })

    const vote = useMutation({
        mutationFn: ({ postId, voteType }: { postId: string; voteType: 'UPVOTE' | 'DOWNVOTE' }) =>
            forumsApi.votePost(postId, voteType),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-thread', threadId] }),
    })

    const markBest = useMutation({
        mutationFn: (postId: string) => forumsApi.markBestAnswer(postId),
        onSuccess: () => {
            toast.success('Marked as best answer!')
            queryClient.invalidateQueries({ queryKey: ['forum-thread', threadId] })
        },
    })

    const deletePost = useMutation({
        mutationFn: (postId: string) => forumsApi.deletePost(postId),
        onSuccess: () => {
            toast.success('Post deleted')
            queryClient.invalidateQueries({ queryKey: ['forum-thread', threadId] })
        },
    })

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        )
    }

    if (!thread) return <div>Thread not found</div>

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Back */}
            <Link href="/forums" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Forums
            </Link>

            {/* Thread header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <Avatar name={thread.user?.name ?? 'User'} src={thread.user?.avatar} />
                        <div className="flex-1">
                            <h1 className="text-xl font-bold">{thread.title}</h1>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span>{thread.user?.name}</span>
                                <span>·</span>
                                <span>{formatRelativeTime(thread.createdAt)}</span>
                            </div>
                            <p className="mt-4 text-foreground leading-relaxed">{thread.content}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Posts */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">{thread.posts?.length ?? 0} Replies</h2>

                {thread.posts?.map((post: ForumPost) => (
                    <Card key={post.id} className={post.isBestAnswer ? 'ring-2 ring-primary' : ''}>
                        <CardContent className="p-5">
                            {post.isBestAnswer && (
                                <div className="flex items-center gap-2 mb-3 text-primary">
                                    <Award className="h-4 w-4" />
                                    <span className="text-sm font-medium">Best Answer</span>
                                </div>
                            )}
                            <div className="flex items-start gap-4">
                                <Avatar name={post.user?.name ?? 'User'} src={post.user?.avatar} />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium text-sm">{post.user?.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2">{formatRelativeTime(post.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {/* Vote actions */}
                                            <button
                                                onClick={() => vote.mutate({ postId: post.id, voteType: 'UPVOTE' })}
                                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${post.userVote === 'UPVOTE' ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground'
                                                    }`}
                                            >
                                                <ThumbsUp className="h-3.5 w-3.5" />
                                                <span>{post.voteCount > 0 ? post.voteCount : ''}</span>
                                            </button>
                                            <button
                                                onClick={() => vote.mutate({ postId: post.id, voteType: 'DOWNVOTE' })}
                                                className={`p-1 rounded-md text-xs transition-colors ${post.userVote === 'DOWNVOTE' ? 'bg-destructive/10 text-destructive' : 'hover:bg-accent text-muted-foreground'
                                                    }`}
                                            >
                                                <ThumbsDown className="h-3.5 w-3.5" />
                                            </button>

                                            {/* Mark as best answer (thread creator) */}
                                            {user?.id === thread.userId && !post.isBestAnswer && (
                                                <button
                                                    onClick={() => markBest.mutate(post.id)}
                                                    className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                                                    title="Mark as best answer"
                                                >
                                                    <Award className="h-3.5 w-3.5" />
                                                </button>
                                            )}

                                            {/* Delete own post */}
                                            {user?.id === post.userId && (
                                                <button
                                                    onClick={() => deletePost.mutate(post.id)}
                                                    className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed">{post.content}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Reply form */}
            {user && !thread.isLocked && (
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <Avatar name={user.name} src={user.avatar} />
                            <div className="flex-1 space-y-3">
                                <Textarea
                                    placeholder="Write your reply..."
                                    rows={4}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => createPost.mutate()}
                                        loading={createPost.isPending}
                                        disabled={!replyContent.trim()}
                                    >
                                        <Reply className="h-4 w-4 mr-2" /> Post Reply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {thread.isLocked && (
                <div className="text-center py-4 text-muted-foreground text-sm border border-border rounded-lg">
                    This thread is locked. No new replies can be posted.
                </div>
            )}
        </div>
    )
}
