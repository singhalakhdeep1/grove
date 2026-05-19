'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Lock, Bell, Shield } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabContent } from '@/components/ui/tabs'
import toast from 'react-hot-toast'

const tabs = [
    { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
]

export default function SettingsPage() {
    const { logout } = useAuthStore()
    const [activeTab, setActiveTab] = useState('security')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [notifPrefs, setNotifPrefs] = useState({
        emailOnNewMessage: true,
        emailOnCourseUpdate: true,
        emailOnNewFollower: false,
        pushNotifications: true,
    })

    const changePassword = useMutation({
        mutationFn: () => authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
        onSuccess: () => {
            toast.success('Password changed successfully!')
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        },
        onError: () => toast.error('Failed to change password. Check your current password.'),
    })

    const handleChangePassword = () => {
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            toast.error('New passwords do not match')
            return
        }
        if (pwForm.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }
        changePassword.mutate()
    }

    return (
        <div className="max-w-2xl space-y-6">
            <h1>Settings</h1>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <TabContent id="security" activeTab={activeTab}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" /> Change Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Input
                                label="Current Password"
                                type={showCurrent ? 'text' : 'password'}
                                value={pwForm.currentPassword}
                                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-8 text-muted-foreground"
                                onClick={() => setShowCurrent(!showCurrent)}
                            >
                                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <div className="relative">
                            <Input
                                label="New Password"
                                type={showNew ? 'text' : 'password'}
                                value={pwForm.newPassword}
                                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                helperText="Minimum 8 characters"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-8 text-muted-foreground"
                                onClick={() => setShowNew(!showNew)}
                            >
                                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={pwForm.confirmPassword}
                            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                        />
                        <Button
                            onClick={handleChangePassword}
                            loading={changePassword.isPending}
                            disabled={!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                        >
                            Update Password
                        </Button>
                    </CardContent>
                </Card>

                <Card className="mt-4 border-destructive/30">
                    <CardHeader>
                        <CardTitle className="text-destructive text-base">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <Button variant="destructive" size="sm">Delete Account</Button>
                    </CardContent>
                </Card>
            </TabContent>

            <TabContent id="notifications" activeTab={activeTab}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" /> Notification Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { key: 'emailOnNewMessage', label: 'Email on new message', description: 'Get an email when you receive a new direct message' },
                            { key: 'emailOnCourseUpdate', label: 'Email on course update', description: 'Get notified when your enrolled courses are updated' },
                            { key: 'emailOnNewFollower', label: 'Email on new follower', description: 'Get notified when someone follows you' },
                            { key: 'pushNotifications', label: 'Push notifications', description: 'Receive in-app push notifications' },
                        ].map(({ key, label, description }) => (
                            <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <div>
                                    <p className="text-sm font-medium">{label}</p>
                                    <p className="text-xs text-muted-foreground">{description}</p>
                                </div>
                                <button
                                    role="switch"
                                    aria-checked={notifPrefs[key as keyof typeof notifPrefs]}
                                    onClick={() => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key as keyof typeof notifPrefs] })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifPrefs[key as keyof typeof notifPrefs] ? 'bg-primary' : 'bg-muted'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifPrefs[key as keyof typeof notifPrefs] ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}
                        <Button className="mt-2">Save Preferences</Button>
                    </CardContent>
                </Card>
            </TabContent>
        </div>
    )
}
