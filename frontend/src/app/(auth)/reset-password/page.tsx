'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token') ?? ''
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPw, setShowPw] = useState(false)

    const reset = useMutation({
        mutationFn: () => authApi.resetPassword({ token, newPassword: password }),
        onSuccess: () => {
            toast.success('Password reset successfully!')
            router.push('/login')
        },
        onError: () => toast.error('Failed to reset password. The link may have expired.'),
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirm) { toast.error('Passwords do not match'); return }
        if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
        reset.mutate()
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <p className="text-destructive font-medium">Invalid or missing reset token.</p>
                        <Link href="/forgot-password" className="text-primary hover:underline text-sm mt-3 block">
                            Request a new reset link
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pb-2">
                    <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-primary-foreground">G</span>
                    </div>
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <p className="text-muted-foreground text-sm">Enter your new password below</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Input
                                label="New Password"
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                helperText="Minimum 8 characters"
                                required
                            />
                            <button type="button" className="absolute right-3 top-8 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full" loading={reset.isPending}>
                            Reset Password
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            <Link href="/login" className="text-primary hover:underline">Back to login</Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
