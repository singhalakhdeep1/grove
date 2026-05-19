'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { GraduationCap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const registerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Must contain uppercase, lowercase, number and special character'),
    role: z.enum(['STUDENT', 'INSTRUCTOR', 'MENTOR']),
})
type RegisterFormData = z.infer<typeof registerSchema>

const roleOptions = [
    { value: 'STUDENT', label: 'Student – Learn from courses' },
    { value: 'INSTRUCTOR', label: 'Instructor – Create and teach courses' },
    { value: 'MENTOR', label: 'Mentor – Mentor other learners' },
]

export default function RegisterPage() {
    const { register: registerUser, isLoading } = useAuthStore()
    const router = useRouter()

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: 'STUDENT' },
    })

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await registerUser(data)
            toast.success('Account created! Please check your email to verify.')
            router.replace('/dashboard')
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed'
            toast.error(Array.isArray(message) ? message[0] : message)
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-bold text-primary">Grove</span>
                    </div>
                </div>
                <CardTitle>Create your account</CardTitle>
                <CardDescription>Join thousands of learners on Grove</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="First Name"
                            placeholder="John"
                            error={errors.firstName?.message}
                            {...register('firstName')}
                        />
                        <Input
                            label="Last Name"
                            placeholder="Doe"
                            error={errors.lastName?.message}
                            {...register('lastName')}
                        />
                    </div>
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        error={errors.email?.message}
                        {...register('email')}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        error={errors.password?.message}
                        helperText="Min 8 chars, uppercase, lowercase, number, and special character"
                        {...register('password')}
                    />
                    <Select
                        label="I want to join as"
                        options={roleOptions}
                        error={errors.role?.message}
                        {...register('role')}
                    />

                    <Button type="submit" className="w-full mt-2" loading={isLoading}>
                        Create Account
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
