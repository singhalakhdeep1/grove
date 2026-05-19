'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Video, Calendar, Clock, Users, Plus } from 'lucide-react'
import { liveSessionsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { LiveSession } from '@/types'

const statusVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
    LIVE: 'success',
    SCHEDULED: 'warning',
    ENDED: 'secondary',
}

export default function LiveSessionsPage() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState({ title: '', description: '', scheduledAt: '', maxParticipants: '100' })

    const { data, isLoading } = useQuery({
        queryKey: ['live-sessions'],
        queryFn: liveSessionsApi.list,
    })

    const create = useMutation({
        mutationFn: () => liveSessionsApi.create({
            ...form,
            maxParticipants: parseInt(form.maxParticipants),
        }),
        onSuccess: () => {
            toast.success('Session created!')
            queryClient.invalidateQueries({ queryKey: ['live-sessions'] })
            setShowCreate(false)
            setForm({ title: '', description: '', scheduledAt: '', maxParticipants: '100' })
        },
        onError: () => toast.error('Failed to create session'),
    })

    const sessions: LiveSession[] = data?.data ?? data ?? []
    const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1>Live Sessions</h1>
                    <p className="text-muted-foreground mt-1">Join live learning sessions or host your own</p>
                </div>
                {isInstructor && (
                    <Button onClick={() => setShowCreate(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Schedule Session
                    </Button>
                )}
            </div>

            {/* Live now */}
            {sessions.filter((s) => s.status === 'LIVE').length > 0 && (
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        LIVE NOW
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sessions.filter((s) => s.status === 'LIVE').map((session) => (
                            <SessionCard key={session.id} session={session} />
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming */}
            <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">UPCOMING</h2>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
                    </div>
                ) : sessions.filter((s) => s.status === 'SCHEDULED').length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No upcoming sessions scheduled</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sessions.filter((s) => s.status === 'SCHEDULED').map((session) => (
                            <SessionCard key={session.id} session={session} />
                        ))}
                    </div>
                )}
            </div>

            {/* Create modal */}
            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Schedule Live Session" size="lg">
                <div className="space-y-4">
                    <Input
                        label="Session Title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    <Input
                        label="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                    <Input
                        label="Scheduled At"
                        type="datetime-local"
                        value={form.scheduledAt}
                        onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    />
                    <Input
                        label="Max Participants"
                        type="number"
                        value={form.maxParticipants}
                        onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!form.title || !form.scheduledAt}>
                            Schedule
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

function SessionCard({ session }: { session: LiveSession }) {
    const queryClient = useQueryClient()
    const { user } = useAuthStore()

    const join = useMutation({
        mutationFn: () => liveSessionsApi.join(session.id),
        onSuccess: (data) => {
            if (data?.url) window.open(data.url, '_blank')
            queryClient.invalidateQueries({ queryKey: ['live-sessions'] })
        },
        onError: () => toast.error('Failed to join session'),
    })

    return (
        <Card className="flex flex-col">
            <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Video className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={statusVariant[session.status] ?? 'secondary'}>{session.status}</Badge>
                </div>
                <h3 className="font-semibold mb-1">{session.title}</h3>
                {session.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{session.description}</p>
                )}
                <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(session.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{session._count?.participants ?? 0} / {session.maxParticipants} participants</span>
                    </div>
                    {session.instructor && (
                        <div className="flex items-center gap-2">
                            <Avatar name={session.instructor.name} src={session.instructor.avatar} size="sm" />
                            <span className="text-xs text-muted-foreground">{session.instructor.name}</span>
                        </div>
                    )}
                </div>
                <Button
                    className="mt-4 w-full"
                    variant={session.status === 'LIVE' ? 'default' : 'outline'}
                    disabled={session.status === 'ENDED'}
                    onClick={() => join.mutate()}
                    loading={join.isPending}
                >
                    {session.status === 'LIVE' ? 'Join Now' : session.status === 'SCHEDULED' ? 'Register' : 'Ended'}
                </Button>
            </CardContent>
        </Card>
    )
}
