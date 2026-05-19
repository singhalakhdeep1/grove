'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Edit3, Save, X } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore()
    const queryClient = useQueryClient()
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({
        name: user?.name ?? '',
        bio: user?.profile?.bio ?? '',
        location: user?.profile?.location ?? '',
        website: user?.profile?.website ?? '',
        skills: user?.profile?.skills?.join(', ') ?? '',
    })

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: authApi.getProfile,
        onSuccess: (data: any) => {
            updateUser(data)
        },
    } as any)

    const updateProfile = useMutation({
        mutationFn: () => authApi.updateProfile({
            name: form.name,
            bio: form.bio,
            location: form.location,
            website: form.website,
            skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        }),
        onSuccess: (data) => {
            updateUser(data)
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            toast.success('Profile updated!')
            setEditing(false)
        },
        onError: () => toast.error('Failed to update profile'),
    })

    const displayUser = profile ?? user

    return (
        <div className="max-w-4xl space-y-6">
            <h1>My Profile</h1>

            {/* Profile card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        <div className="relative">
                            <Avatar name={displayUser?.name ?? 'User'} src={displayUser?.avatar} size="xl" />
                        </div>
                        <div className="flex-1">
                            {editing ? (
                                <div className="space-y-3">
                                    <Input
                                        label="Full Name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                    <Textarea
                                        label="Bio"
                                        rows={3}
                                        value={form.bio}
                                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Location"
                                            value={form.location}
                                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        />
                                        <Input
                                            label="Website"
                                            value={form.website}
                                            onChange={(e) => setForm({ ...form, website: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        label="Skills (comma-separated)"
                                        value={form.skills}
                                        onChange={(e) => setForm({ ...form, skills: e.target.value })}
                                    />
                                    <div className="flex gap-3">
                                        <Button onClick={() => updateProfile.mutate()} loading={updateProfile.isPending}>
                                            <Save className="h-4 w-4 mr-2" /> Save Changes
                                        </Button>
                                        <Button variant="outline" onClick={() => setEditing(false)}>
                                            <X className="h-4 w-4 mr-2" /> Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2>{displayUser?.name}</h2>
                                            <p className="text-muted-foreground text-sm">{displayUser?.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge>{displayUser?.role}</Badge>
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setForm({
                                                    name: displayUser?.name ?? '',
                                                    bio: displayUser?.profile?.bio ?? '',
                                                    location: displayUser?.profile?.location ?? '',
                                                    website: displayUser?.profile?.website ?? '',
                                                    skills: displayUser?.profile?.skills?.join(', ') ?? '',
                                                })
                                                setEditing(true)
                                            }}>
                                                <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                                            </Button>
                                        </div>
                                    </div>
                                    {displayUser?.profile?.bio && (
                                        <p className="text-sm mt-3 leading-relaxed">{displayUser.profile.bio}</p>
                                    )}
                                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                                        {displayUser?.profile?.location && <span>📍 {displayUser.profile.location}</span>}
                                        {displayUser?.profile?.website && (
                                            <a href={displayUser.profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                🔗 {displayUser.profile.website}
                                            </a>
                                        )}
                                        <span>📅 Joined {formatDate(displayUser?.createdAt ?? '')}</span>
                                    </div>
                                    {displayUser?.profile?.skills?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {displayUser.profile.skills.map((skill: string) => (
                                                <Badge key={skill} variant="secondary">{skill}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Courses Enrolled', value: displayUser?.stats?.coursesEnrolled ?? 0 },
                    { label: 'Courses Completed', value: displayUser?.stats?.coursesCompleted ?? 0 },
                    { label: 'Total XP', value: displayUser?.stats?.totalPoints?.toLocaleString() ?? 0 },
                    { label: 'Current Level', value: `Lv. ${displayUser?.stats?.currentLevel ?? 1}` },
                ].map(({ label, value }) => (
                    <Card key={label}>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold">{value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
