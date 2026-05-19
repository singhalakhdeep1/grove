'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Calendar, DollarSign, Users, Filter } from 'lucide-react'
import { mentorshipApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { Textarea, Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabContent } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { MentorProfile, MentorshipRequest } from '@/types'

const tabs = [
    { id: 'discover', label: 'Find Mentors' },
    { id: 'requests', label: 'My Requests' },
    { id: 'sessions', label: 'Sessions' },
]

export default function MentorshipPage() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('discover')
    const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null)
    const [requestForm, setRequestForm] = useState({ message: '', topic: '' })
    const [search, setSearch] = useState('')

    const { data: mentors, isLoading } = useQuery({
        queryKey: ['mentors', search],
        queryFn: () => mentorshipApi.listMentors({ search }),
    })

    const { data: myRequests } = useQuery({
        queryKey: ['mentorship-requests'],
        queryFn: mentorshipApi.listRequests,
        enabled: activeTab === 'requests',
    })

    const { data: sessions } = useQuery({
        queryKey: ['mentorship-sessions'],
        queryFn: mentorshipApi.listSessions,
        enabled: activeTab === 'sessions',
    })

    const requestMentorship = useMutation({
        mutationFn: () => mentorshipApi.requestMentorship(selectedMentor!.id, requestForm),
        onSuccess: () => {
            toast.success('Mentorship request sent!')
            queryClient.invalidateQueries({ queryKey: ['mentorship-requests'] })
            setSelectedMentor(null)
            setRequestForm({ message: '', topic: '' })
        },
        onError: () => toast.error('Failed to send request'),
    })

    const mentorList: MentorProfile[] = mentors?.data ?? mentors ?? []
    const requestList: MentorshipRequest[] = myRequests ?? []

    const statusVariant: Record<string, any> = {
        PENDING: 'warning',
        ACCEPTED: 'success',
        REJECTED: 'destructive',
        COMPLETED: 'secondary',
    }

    return (
        <div className="space-y-6">
            <div>
                <h1>Mentorship</h1>
                <p className="text-muted-foreground mt-1">Connect with expert mentors to accelerate your learning</p>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <TabContent id="discover" activeTab={activeTab}>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by name or expertise..."
                        className="input w-full max-w-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
                    </div>
                ) : mentorList.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No mentors found</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mentorList.map((mentor) => (
                            <Card key={mentor.id} className="flex flex-col">
                                <CardContent className="p-5 flex flex-col h-full">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Avatar name={mentor.user?.name ?? 'Mentor'} src={mentor.user?.avatar} size="lg" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold">{mentor.user?.name}</h3>
                                            {mentor.title && <p className="text-sm text-muted-foreground">{mentor.title}</p>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{mentor.bio}</p>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {mentor.expertise?.slice(0, 3).map((e) => (
                                            <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                                        ))}
                                    </div>
                                    <div className="mt-auto grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground border-t border-border pt-3">
                                        <div>
                                            <p className="font-bold text-foreground">{mentor.rating?.toFixed(1) ?? '–'}</p>
                                            <p>Rating</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">{mentor.totalSessions ?? 0}</p>
                                            <p>Sessions</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">${mentor.hourlyRate ?? 0}</p>
                                            <p>Per Hour</p>
                                        </div>
                                    </div>
                                    <Button className="mt-4 w-full" variant="outline" onClick={() => setSelectedMentor(mentor)}>
                                        Request Mentorship
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabContent>

            <TabContent id="requests" activeTab={activeTab}>
                {requestList.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No requests yet. Find a mentor to get started.</div>
                ) : (
                    <div className="space-y-3">
                        {requestList.map((req) => (
                            <Card key={req.id}>
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Avatar name={req.mentor?.user?.name ?? 'Mentor'} src={req.mentor?.user?.avatar} />
                                    <div className="flex-1">
                                        <p className="font-medium">{req.mentor?.user?.name}</p>
                                        <p className="text-sm text-muted-foreground">{req.topic}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</p>
                                    </div>
                                    <Badge variant={statusVariant[req.status]}>{req.status}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabContent>

            <TabContent id="sessions" activeTab={activeTab}>
                {(sessions as any[])?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No sessions yet.</div>
                ) : (
                    <div className="space-y-3">
                        {(sessions as any[])?.map((s) => (
                            <Card key={s.id}>
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{s.topic}</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(s.scheduledAt)} · {s.duration} min</p>
                                    </div>
                                    <Badge>{s.status}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabContent>

            {/* Request modal */}
            <Modal open={!!selectedMentor} onClose={() => setSelectedMentor(null)} title="Request Mentorship" size="md">
                {selectedMentor && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                            <Avatar name={selectedMentor.user?.name ?? 'Mentor'} src={selectedMentor.user?.avatar} />
                            <div>
                                <p className="font-medium">{selectedMentor.user?.name}</p>
                                <p className="text-sm text-muted-foreground">${selectedMentor.hourlyRate}/hr</p>
                            </div>
                        </div>
                        <Input
                            label="Topic"
                            placeholder="What would you like to learn?"
                            value={requestForm.topic}
                            onChange={(e) => setRequestForm({ ...requestForm, topic: e.target.value })}
                        />
                        <Textarea
                            label="Message"
                            placeholder="Tell the mentor about your goals and background..."
                            rows={4}
                            value={requestForm.message}
                            onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setSelectedMentor(null)}>Cancel</Button>
                            <Button
                                onClick={() => requestMentorship.mutate()}
                                loading={requestMentorship.isPending}
                                disabled={!requestForm.topic || !requestForm.message}
                            >
                                Send Request
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
