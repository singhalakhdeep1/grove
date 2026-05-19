'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Award, Search, Shield } from 'lucide-react'
import { certificationApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Certificate } from '@/types'

export default function CertificationsPage() {
    const [verifyCode, setVerifyCode] = useState('')
    const [verifyResult, setVerifyResult] = useState<any>(null)
    const [verifying, setVerifying] = useState(false)

    const { data: certs, isLoading } = useQuery({
        queryKey: ['certificates'],
        queryFn: certificationApi.getCertificates,
    })

    const handleVerify = async () => {
        if (!verifyCode.trim()) return
        setVerifying(true)
        try {
            const result = await certificationApi.verifyCertificate(verifyCode)
            setVerifyResult(result)
        } catch {
            toast.error('Certificate not found or invalid')
            setVerifyResult(null)
        } finally {
            setVerifying(false)
        }
    }

    const certificates: Certificate[] = certs ?? []

    return (
        <div className="space-y-8">
            <div>
                <h1>Certifications</h1>
                <p className="text-muted-foreground mt-1">Your earned certificates and credentials</p>
            </div>

            {/* Certificates grid */}
            <div>
                <h2 className="text-lg font-semibold mb-4">My Certificates</h2>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
                    </div>
                ) : certificates.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-muted-foreground">No certificates yet. Complete a course to earn your first one!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {certificates.map((cert) => (
                            <Card key={cert.id} className="overflow-hidden">
                                {/* Certificate banner */}
                                <div className="bg-gradient-to-br from-primary/80 to-primary p-6 text-primary-foreground">
                                    <Award className="h-8 w-8 mb-2" />
                                    <h3 className="font-bold text-lg leading-tight">{cert.courseTitle}</h3>
                                </div>
                                <CardContent className="p-4">
                                    <div className="space-y-1 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Issued</span>
                                            <span className="font-medium">{formatDate(cert.issuedAt)}</span>
                                        </div>
                                        {cert.expiresAt && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Expires</span>
                                                <span className="font-medium">{formatDate(cert.expiresAt)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Certificate ID</span>
                                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{cert.certificateId}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" size="sm" className="flex-1" asChild>
                                            <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                                            </a>
                                        </Button>
                                        <Badge variant="success" className="flex-1 justify-center">Verified</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Verify certificate */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" /> Verify a Certificate
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Enter a certificate ID to verify its authenticity.
                    </p>
                    <div className="flex gap-3 max-w-md">
                        <input
                            type="text"
                            placeholder="Enter certificate ID..."
                            className="input flex-1"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                        />
                        <Button onClick={handleVerify} loading={verifying}>
                            <Search className="h-4 w-4 mr-2" /> Verify
                        </Button>
                    </div>

                    {verifyResult && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-2">
                                <Shield className="h-4 w-4" /> Certificate is Valid
                            </div>
                            <div className="text-sm space-y-1">
                                <p><span className="text-muted-foreground">Course:</span> <span className="font-medium">{verifyResult.courseTitle}</span></p>
                                <p><span className="text-muted-foreground">Recipient:</span> <span className="font-medium">{verifyResult.userName}</span></p>
                                <p><span className="text-muted-foreground">Issued:</span> <span className="font-medium">{formatDate(verifyResult.issuedAt)}</span></p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
