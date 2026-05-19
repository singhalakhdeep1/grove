import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { S3Service } from '../common/services/s3.service';
import { PrismaService } from '../prisma/prisma.service';
import { VideoProcessingStatus } from '@prisma/client';

@Injectable()
export class VideoProcessingService {
    constructor(
        private s3Service: S3Service,
        private prisma: PrismaService,
    ) { }

    async processVideo(videoId: string, inputPath: string): Promise<void> {
        try {
            // Update status to processing
            await this.prisma.video.update({
                where: { id: videoId },
                data: { processingStatus: VideoProcessingStatus.PROCESSING },
            });

            // Transcode to HLS format
            const outputPath = `/tmp/hls-${videoId}`;

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .outputOptions([
                        '-codec: copy',
                        '-start_number 0',
                        '-hls_time 10',
                        '-hls_list_size 0',
                        '-f hls',
                    ])
                    .output(`${outputPath}/master.m3u8`)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });

            // Upload HLS files to S3
            const hlsUrl = await this.uploadHLSToS3(videoId, outputPath);

            // Generate thumbnail
            const thumbnailUrl = await this.generateThumbnail(videoId, inputPath);

            // Get video duration
            const duration = await this.getVideoDuration(inputPath);

            // Update video record
            await this.prisma.video.update({
                where: { id: videoId },
                data: {
                    hlsUrl,
                    thumbnailUrl,
                    duration,
                    processingStatus: VideoProcessingStatus.COMPLETED,
                },
            });
        } catch (error) {
            await this.prisma.video.update({
                where: { id: videoId },
                data: { processingStatus: VideoProcessingStatus.FAILED },
            });
            throw error;
        }
    }

    private async uploadHLSToS3(videoId: string, folderPath: string): Promise<string> {
        // Implementation to upload HLS files
        return `https://s3.amazonaws.com/videos/hls/${videoId}/master.m3u8`;
    }

    private async generateThumbnail(videoId: string, inputPath: string): Promise<string> {
        // Implementation to generate and upload thumbnail
        return `https://s3.amazonaws.com/videos/thumbnails/${videoId}.jpg`;
    }

    private async getVideoDuration(inputPath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(Math.floor(metadata.format.duration));
            });
        });
    }
}
