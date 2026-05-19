import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '*.amazonaws.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
            { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
            { protocol: 'https', hostname: 'ui-avatars.com' },
        ],
    },
    experimental: {
        serverActions: { allowedOrigins: ['localhost:3000', 'localhost:3001'] },
    },
}

export default nextConfig
