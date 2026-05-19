'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messagingApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Conversation, DirectMessage } from '@/types'

export default function MessagingPage() {
    const { user } = useAuthStore()
    const router = useRouter()
    const [selectedConv, setSelectedConv] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const queryClient = useQueryClient()

    const { data: conversations, isLoading: convsLoading } = useQuery({
        queryKey: ['conversations'],
        queryFn: messagingApi.getConversations,
    })

    const { data: messages, isLoading: msgsLoading } = useQuery({
        queryKey: ['messages', selectedConv],
        queryFn: () => messagingApi.getMessages(selectedConv!),
        enabled: !!selectedConv,
    })

    const sendMessage = useMutation({
        mutationFn: () => messagingApi.sendMessage(selectedConv!, newMessage),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedConv] })
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
            setNewMessage('')
        },
        onError: () => toast.error('Failed to send message'),
    })

    const convList: Conversation[] = conversations ?? []
    const msgList: DirectMessage[] = messages?.data ?? messages ?? []

    const selectedConvData = convList.find((c) => c.id === selectedConv)
    const otherParticipant = selectedConvData?.participants?.find((p) => p.id !== user?.id)

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-4">
            {/* Conversations list */}
            <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {convsLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-4 flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </div>
                        ))
                        : convList.map((conv) => {
                            const other = conv.participants?.find((p) => p.id !== user?.id)
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConv(conv.id)}
                                    className={`w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors text-left border-b border-border/50 ${selectedConv === conv.id ? 'bg-accent' : ''
                                        }`}
                                >
                                    <div className="relative">
                                        <Avatar name={other?.name ?? 'User'} src={other?.avatar} size="md" />
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-xs text-white flex items-center justify-center">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{other?.name ?? 'User'}</p>
                                        {conv.lastMessage && (
                                            <p className="text-xs text-muted-foreground truncate">{conv.lastMessage.content}</p>
                                        )}
                                    </div>
                                    {conv.lastMessage && (
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                            {formatRelativeTime(conv.lastMessage.createdAt)}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                </div>
            </Card>

            {/* Message thread */}
            {selectedConv ? (
                <Card className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center gap-3">
                        <button onClick={() => setSelectedConv(null)} className="sm:hidden p-1 hover:bg-accent rounded-md">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <Avatar name={otherParticipant?.name ?? 'User'} src={otherParticipant?.avatar} size="sm" />
                        <span className="font-semibold">{otherParticipant?.name}</span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {msgsLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-2/3" />)}
                            </div>
                        ) : msgList.map((msg) => {
                            const isOwn = msg.senderId === user?.id
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isOwn && <Avatar name={msg.sender?.name ?? 'User'} src={msg.sender?.avatar} size="sm" />}
                                    <div
                                        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isOwn
                                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                : 'bg-muted rounded-bl-sm'
                                            }`}
                                    >
                                        {msg.content}
                                        <div className={`text-xs mt-0.5 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {formatRelativeTime(msg.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-border">
                        <form
                            onSubmit={(e) => { e.preventDefault(); if (newMessage.trim()) sendMessage.mutate() }}
                            className="flex items-center gap-3"
                        >
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 input"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                loading={sendMessage.isPending}
                                disabled={!newMessage.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </Card>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold">Your Messages</h3>
                        <p className="text-muted-foreground text-sm mt-1">Select a conversation to start messaging</p>
                    </div>
                </div>
            )}
        </div>
    )
}
