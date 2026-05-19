'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Users, Plus, Lock, Globe } from 'lucide-react'
import { studyGroupsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { StudyGroup } from '@/types'

export default function StudyGroupsPage() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState({ name: '', description: '', isPrivate: false, maxMembers: '50' })

    const { data, isLoading } = useQuery({
        queryKey: ['study-groups'],
        queryFn: studyGroupsApi.list,
    })

    const create = useMutation({
        mutationFn: () => studyGroupsApi.create({ ...form, maxMembers: parseInt(form.maxMembers) }),
        onSuccess: () => {
            toast.success('Study group created!')
            queryClient.invalidateQueries({ queryKey: ['study-groups'] })
            setShowCreate(false)
            setForm({ name: '', description: '', isPrivate: false, maxMembers: '50' })
        },
        onError: () => toast.error('Failed to create group'),
    })

    const join = useMutation({
        mutationFn: (groupId: string) => studyGroupsApi.join(groupId),
        onSuccess: () => {
            toast.success('Joined group!')
            queryClient.invalidateQueries({ queryKey: ['study-groups'] })
        },
        onError: () => toast.error('Failed to join group'),
    })

    const groups: StudyGroup[] = data?.data ?? data ?? []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1>Study Groups</h1>
                    <p className="text-muted-foreground mt-1">Collaborate and learn with peers</p>
                </div>
                {user && (
                    <Button onClick={() => setShowCreate(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Create Group
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>No study groups yet. Create the first one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                        <Card key={group.id} className="flex flex-col">
                            <CardContent className="p-5 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        {group.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                        {group.isPrivate ? 'Private' : 'Public'}
                                    </div>
                                </div>
                                <h3 className="font-semibold mb-1">{group.name}</h3>
                                {group.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
                                )}
                                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {group._count?.members ?? 0} / {group.maxMembers} members
                                    </span>
                                    <span>Created {formatDate(group.createdAt)}</span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Link href={`/study-groups/${group.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full">View</Button>
                                    </Link>
                                    {!group.isMember && (
                                        <Button
                                            className="flex-1"
                                            onClick={() => join.mutate(group.id)}
                                            loading={join.isPending}
                                        >
                                            Join
                                        </Button>
                                    )}
                                    {group.isMember && <Badge variant="success" className="flex items-center">Joined</Badge>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Study Group" size="md">
                <div className="space-y-4">
                    <Input label="Group Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Textarea
                        label="Description"
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                    <Input
                        label="Max Members"
                        type="number"
                        value={form.maxMembers}
                        onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.isPrivate}
                            onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm">Private group (invite only)</span>
                    </label>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!form.name}>
                            Create Group
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
