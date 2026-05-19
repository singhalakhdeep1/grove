'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { GraduationCap, ArrowLeft } from 'lucide-react'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const schema = z.object({ email: z.string().email('Invalid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

    const onSubmit = async (data: FormData) => {
        setLoading(true)
        try {
            await authApi.forgotPassword(data.email)
            setSent(true)
        } catch {
            toast.error('Failed to send reset email. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                    <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Reset your password</CardTitle>
                <CardDescription>We&apos;ll email you a link to reset it</CardDescription>
            </CardHeader>
            <CardContent>
                {sent ? (
                    <div className="text-center space-y-4">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Check your email for a password reset link. It may take a few minutes.
                        </p>
                        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                            <ArrowLeft className="h-4 w-4" /> Back to login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Email address"
                            type="email"
                            placeholder="you@example.com"
                            error={errors.email?.message}
                            {...register('email')}
                        />
                        <Button type="submit" className="w-full" loading={loading}>
                            Send Reset Link
                        </Button>
                        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" /> Back to login
                        </Link>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}
