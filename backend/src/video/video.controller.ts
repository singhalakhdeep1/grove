import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  // ============================================
  // BOOKMARKS
  // ============================================

  /**
   * Create a video bookmark
   */
  @Post('bookmarks')
  async createBookmark(
    @Request() req,
    @Body() body: {
      lessonId: string;
      timestamp: number;
      title?: string;
      description?: string;
    },
  ) {
    return await this.videoService.createBookmark(
      req.user.id,
      body.lessonId,
      body,
    );
  }

  /**
   * Get bookmarks for a lesson
   */
  @Get('bookmarks/:lessonId')
  async getLessonBookmarks(
    @Request() req,
    @Param('lessonId') lessonId: string,
  ) {
    return await this.videoService.getLessonBookmarks(req.user.id, lessonId);
  }

  /**
   * Delete a bookmark
   */
  @Delete('bookmarks/:bookmarkId')
  async deleteBookmark(
    @Request() req,
    @Param('bookmarkId') bookmarkId: string,
  ) {
    return await this.videoService.deleteBookmark(req.user.id, bookmarkId);
  }

  // ============================================
  // NOTES
  // ============================================

  /**
   * Create a video note
   */
  @Post('notes')
  async createNote(
    @Request() req,
    @Body() body: {
      lessonId: string;
      timestamp: number;
      content: string;
      isPrivate?: boolean;
    },
  ) {
    return await this.videoService.createNote(
      req.user.id,
      body.lessonId,
      body,
    );
  }

  /**
   * Get notes for a lesson
   */
  @Get('notes/:lessonId')
  async getLessonNotes(
    @Request() req,
    @Param('lessonId') lessonId: string,
    @Query('includePublic') includePublic?: string,
  ) {
    return await this.videoService.getLessonNotes(
      req.user.id,
      lessonId,
      includePublic === 'true',
    );
  }

  /**
   * Update a note
   */
  @Put('notes/:noteId')
  async updateNote(
    @Request() req,
    @Param('noteId') noteId: string,
    @Body() body: {
      content?: string;
      isPrivate?: boolean;
    },
  ) {
    return await this.videoService.updateNote(req.user.id, noteId, body);
  }

  /**
   * Delete a note
   */
  @Delete('notes/:noteId')
  async deleteNote(@Request() req, @Param('noteId') noteId: string) {
    return await this.videoService.deleteNote(req.user.id, noteId);
  }

  // ============================================
  // PLAYBACK SESSIONS
  // ============================================

  /**
   * Start a playback session
   */
  @Post('playback/start')
  async startPlaybackSession(
    @Request() req,
    @Body() body: {
      lessonId: string;
      quality?: string;
      playbackSpeed?: number;
    },
  ) {
    return await this.videoService.startPlaybackSession(
      req.user.id,
      body.lessonId,
      body,
    );
  }

  /**
   * Update playback progress
   */
  @Put('playback/:sessionId')
  async updatePlaybackProgress(
    @Request() req,
    @Param('sessionId') sessionId: string,
    @Body() body: {
      lastPosition: number;
      totalWatchTime: number;
      completionRate: number;
    },
  ) {
    return await this.videoService.updatePlaybackProgress(
      req.user.id,
      sessionId,
      body,
    );
  }

  /**
   * End a playback session
   */
  @Post('playback/:sessionId/end')
  async endPlaybackSession(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ) {
    return await this.videoService.endPlaybackSession(req.user.id, sessionId);
  }

  /**
   * Get user's playback history
   */
  @Get('playback/history/:lessonId')
  async getPlaybackHistory(
    @Request() req,
    @Param('lessonId') lessonId: string,
  ) {
    return await this.videoService.getUserPlaybackHistory(req.user.id, lessonId);
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get video analytics for a lesson
   */
  @Get('analytics/:lessonId')
  async getVideoAnalytics(@Param('lessonId') lessonId: string) {
    return await this.videoService.getVideoAnalytics(lessonId);
  }

  /**
   * Get video heatmap
   */
  @Get('heatmap/:lessonId')
  async getVideoHeatmap(@Param('lessonId') lessonId: string) {
    return await this.videoService.getVideoHeatmap(lessonId);
  }

  /**
   * Get drop-off points
   */
  @Get('dropoff/:lessonId')
  async getDropOffPoints(@Param('lessonId') lessonId: string) {
    return await this.videoService.getDropOffPoints(lessonId);
  }
}