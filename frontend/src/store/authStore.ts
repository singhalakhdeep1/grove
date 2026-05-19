'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { authApi } from '@/lib/api'

interface AuthState {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<void>
    register: (data: {
        email: string
        password: string
        firstName: string
        lastName: string
        role?: string
    }) => Promise<void>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
    updateUser: (user: Partial<User>) => void
    setTokens: (accessToken: string, refreshToken: string) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            isAuthenticated: false,

            setTokens: (accessToken, refreshToken) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', accessToken)
                    localStorage.setItem('refreshToken', refreshToken)
                }
                set({ accessToken, refreshToken })
            },

            login: async (email, password) => {
                set({ isLoading: true })
                try {
                    const data = await authApi.login({ email, password })
                    const { user, accessToken, refreshToken } = data
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('accessToken', accessToken)
                        localStorage.setItem('refreshToken', refreshToken)
                    }
                    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false })
                } catch (err) {
                    set({ isLoading: false })
                    throw err
                }
            },

            register: async (data) => {
                set({ isLoading: true })
                try {
                    const res = await authApi.register(data)
                    const { user, accessToken, refreshToken } = res
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('accessToken', accessToken)
                        localStorage.setItem('refreshToken', refreshToken)
                    }
                    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false })
                } catch (err) {
                    set({ isLoading: false })
                    throw err
                }
            },

            logout: async () => {
                const { refreshToken } = get()
                try {
                    if (refreshToken) await authApi.logout(refreshToken)
                } catch {
                    // ignore
                }
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                }
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
            },

            refreshUser: async () => {
                try {
                    const user = await authApi.getProfile()
                    set({ user, isAuthenticated: true })
                } catch {
                    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
                }
            },

            updateUser: (partial) => {
                const { user } = get()
                if (user) set({ user: { ...user, ...partial } })
            },
        }),
        {
            name: 'grove-auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
