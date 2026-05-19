'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Zap, Shield, Star, Medal, Users, TrendingUp, Award } from 'lucide-react'
import { gamificationApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabContent } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { Achievement, Badge as BadgeType, LeaderboardEntry } from '@/types'

const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="h-4 w-4" /> },
    { id: 'badges', label: 'Badges', icon: <Shield className="h-4 w-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Users className="h-4 w-4" /> },
]

const timeframes = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'allTime', label: 'All Time' },
]

export default function GamificationPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'allTime'>('weekly')

    const { data: progress, isLoading: progressLoading } = useQuery({
        queryKey: ['gamification-progress'],
        queryFn: gamificationApi.getProgress,
    })

    const { data: achievements, isLoading: achievementsLoading } = useQuery({
        queryKey: ['achievements'],
        queryFn: gamificationApi.getAchievements,
    })

    const { data: badges, isLoading: badgesLoading } = useQuery({
        queryKey: ['badges'],
        queryFn: gamificationApi.getBadges,
    })

    const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
        queryKey: ['leaderboard', timeframe],
        queryFn: () => gamificationApi.getLeaderboard(timeframe),
        enabled: activeTab === 'leaderboard',
    })

    const achievementList: Achievement[] = achievements ?? []
    const badgeList: BadgeType[] = badges ?? []
    const leaderboardList: LeaderboardEntry[] = leaderboard ?? []

    return (
        <div className="space-y-6">
            <div>
                <h1>Gamification</h1>
                <p className="text-muted-foreground mt-1">Track your progress, earn achievements, and climb the leaderboard</p>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <TabContent id="overview" activeTab={activeTab}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total XP', value: progress?.totalPoints?.toLocaleString() ?? '0', icon: Star, color: 'text-yellow-500' },
                        { label: 'Current Level', value: `Lv. ${progress?.currentLevel ?? 1}`, icon: TrendingUp, color: 'text-blue-500' },
                        { label: 'Current Streak', value: `${progress?.currentStreak ?? 0} days`, icon: Zap, color: 'text-orange-500' },
                        { label: 'Leaderboard Rank', value: progress?.rank ? `#${progress.rank}` : '–', icon: Trophy, color: 'text-purple-500' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <Card key={label}>
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center">
                                    <Icon className={`h-6 w-6 ${color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{label}</p>
                                    <p className="text-xl font-bold">{progressLoading ? <Skeleton className="h-6 w-16" /> : value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {progress && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Level Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-lg">Level {progress.currentLevel} – {progress.levelName}</span>
                                <Badge variant="success">{progress.totalPoints.toLocaleString()} XP</Badge>
                            </div>
                            <Progress
                                value={progress.totalPoints}
                                max={progress.totalPoints + progress.pointsToNextLevel}
                                showLabel
                                color="success"
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                                {progress.pointsToNextLevel.toLocaleString()} XP needed for Level {progress.currentLevel + 1}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="text-center p-4 bg-muted rounded-lg">
                                    <p className="text-2xl font-bold text-orange-500">{progress.currentStreak}</p>
                                    <p className="text-sm text-muted-foreground">Current Streak</p>
                                </div>
                                <div className="text-center p-4 bg-muted rounded-lg">
                                    <p className="text-2xl font-bold text-blue-500">{progress.longestStreak}</p>
                                    <p className="text-sm text-muted-foreground">Longest Streak</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </TabContent>

            <TabContent id="achievements" activeTab={activeTab}>
                {achievementsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {achievementList.map((achievement) => (
                            <Card key={achievement.id} className={achievement.isUnlocked ? 'ring-1 ring-primary' : 'opacity-60'}>
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${achievement.isUnlocked ? 'bg-primary/10' : 'bg-muted'
                                        }`}>
                                        {achievement.icon || '🏆'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{achievement.title}</p>
                                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant={achievement.isUnlocked ? 'success' : 'secondary'}>
                                                +{achievement.points} XP
                                            </Badge>
                                            {achievement.unlockedAt && (
                                                <span className="text-xs text-muted-foreground">{formatDate(achievement.unlockedAt)}</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabContent>

            <TabContent id="badges" activeTab={activeTab}>
                {badgesLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {badgeList.map((badge) => (
                            <Card key={badge.id} className={`text-center ${badge.isEarned ? '' : 'opacity-50 grayscale'}`}>
                                <CardContent className="p-4 flex flex-col items-center gap-2">
                                    <div
                                        className="h-14 w-14 rounded-full flex items-center justify-center text-3xl"
                                        style={{ backgroundColor: badge.color + '20' }}
                                    >
                                        {badge.icon || '🎖️'}
                                    </div>
                                    <p className="text-xs font-semibold text-center">{badge.title}</p>
                                    {badge.earnedAt && (
                                        <span className="text-xs text-muted-foreground">{formatDate(badge.earnedAt)}</span>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabContent>

            <TabContent id="leaderboard" activeTab={activeTab}>
                <div className="flex gap-2 mb-4">
                    {timeframes.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setTimeframe(t.value as typeof timeframe)}
                            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${timeframe === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <Card>
                    <CardContent className="p-0">
                        {leaderboardLoading ? (
                            <div className="p-4 space-y-4">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-3 w-1/4" />
                                        </div>
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                ))}
                            </div>
                        ) : leaderboardList.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">No data available</div>
                        ) : (
                            leaderboardList.map((entry, index) => (
                                <div
                                    key={entry.userId}
                                    className={`flex items-center gap-4 p-4 border-b border-border last:border-0 ${index < 3 ? 'bg-gradient-to-r from-yellow-50/50 dark:from-yellow-950/20 to-transparent' : ''
                                        }`}
                                >
                                    <div className="w-8 text-center font-bold text-sm">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                                    </div>
                                    <Avatar name={entry.name} src={entry.avatar} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{entry.name}</p>
                                        <p className="text-xs text-muted-foreground">Level {entry.level} · {entry.streak} day streak</p>
                                    </div>
                                    <Badge variant="secondary" className="font-bold">
                                        {entry.points.toLocaleString()} XP
                                    </Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </TabContent>
        </div>
    )
}
