'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Bookmark, Plus, X, SkipBack, SkipForward, Settings } from 'lucide-react'
import { videoApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'

interface VideoPlayerProps {
  lessonId: string
  videoUrl: string
  title: string
  duration?: number
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

export function InteractiveVideoPlayer({
  lessonId,
  videoUrl,
  title,
  duration = 0,
  onProgress,
  onComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [totalWatchTime, setTotalWatchTime] = useState(0)

  // Bookmarks and Notes
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [showBookmarkModal, setShowBookmarkModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [bookmarkTitle, setBookmarkTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')

  // Controls visibility
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadBookmarks()
    loadNotes()
    startPlaybackSession()

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [lessonId])

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && videoRef.current) {
        setTotalWatchTime(prev => prev + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying])

  const loadBookmarks = async () => {
    try {
      const data = await videoApi.getBookmarks(lessonId)
      setBookmarks(data)
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    }
  }

  const loadNotes = async () => {
    try {
      const data = await videoApi.getNotes(lessonId)
      setNotes(data)
    } catch (error) {
      console.error('Failed to load notes:', error)
    }
  }

  const startPlaybackSession = async () => {
    try {
      const session = await videoApi.startPlayback(lessonId, { playbackSpeed })
      setSessionId(session.id)
    } catch (error) {
      console.error('Failed to start playback session:', error)
    }
  }

  const updateProgress = async () => {
    if (!sessionId || !videoRef.current) return

    const completionRate = currentTime / duration

    try {
      await videoApi.updateProgress(sessionId, {
        lastPosition: Math.floor(currentTime),
        totalWatchTime,
        completionRate,
      })

      if (onProgress) {
        onProgress(completionRate)
      }

      if (completionRate >= 0.9 && onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      updateProgress()
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }
  }

  const addBookmark = async () => {
    try {
      await videoApi.createBookmark(lessonId, {
        timestamp: Math.floor(currentTime),
        title: bookmarkTitle || `Bookmark at ${formatTime(currentTime)}`,
      })
      setShowBookmarkModal(false)
      setBookmarkTitle('')
      loadBookmarks()
    } catch (error) {
      console.error('Failed to add bookmark:', error)
    }
  }

  const addNote = async () => {
    try {
      await videoApi.createNote(lessonId, {
        timestamp: Math.floor(currentTime),
        content: noteContent,
        isPrivate: true,
      })
      setShowNoteModal(false)
      setNoteContent('')
      loadNotes()
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  const jumpToTimestamp = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      await videoApi.deleteBookmark(lessonId, bookmarkId)
      loadBookmarks()
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      await videoApi.deleteNote(lessonId, noteId)
      loadNotes()
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false)
          onComplete?.()
        }}
      />

      {/* Video Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:text-white"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:text-white"
              onClick={() => skip(-10)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:text-white"
              onClick={() => skip(10)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 ml-4">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:text-white"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1 ml-4">
              <span className="text-white text-xs">{playbackSpeed}x</span>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:text-white h-6 w-6"
                onClick={() => changePlaybackSpeed(playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1)}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:text-white"
              onClick={() => setShowBookmarkModal(true)}
            >
              <Bookmark className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:text-white"
              onClick={() => setShowNoteModal(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:text-white"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Bookmarks Sidebar */}
      {bookmarks.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-black/70 p-4 overflow-y-auto">
          <h3 className="text-white font-semibold mb-3">Bookmarks</h3>
          {bookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="mb-2 p-2 bg-white/10">
              <div className="flex justify-between items-start">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => jumpToTimestamp(bookmark.timestamp)}
                >
                  <p className="text-white text-sm font-medium">{bookmark.title}</p>
                  <p className="text-white/60 text-xs">{formatTime(bookmark.timestamp)}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white/60 hover:text-white h-6 w-6"
                  onClick={() => deleteBookmark(bookmark.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Notes Sidebar */}
      {notes.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-64 bg-black/70 p-4 overflow-y-auto">
          <h3 className="text-white font-semibold mb-3">Notes</h3>
          {notes.map((note) => (
            <Card key={note.id} className="mb-2 p-2 bg-white/10">
              <div className="flex justify-between items-start">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => jumpToTimestamp(note.timestamp)}
                >
                  <p className="text-white text-sm">{note.content}</p>
                  <p className="text-white/60 text-xs">{formatTime(note.timestamp)}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white/60 hover:text-white h-6 w-6"
                  onClick={() => deleteNote(note.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bookmark Modal */}
      <Modal open={showBookmarkModal} onClose={() => setShowBookmarkModal(false)}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add Bookmark</h3>
          <Input
            placeholder="Bookmark title"
            value={bookmarkTitle}
            onChange={(e) => setBookmarkTitle(e.target.value)}
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBookmarkModal(false)}>
              Cancel
            </Button>
            <Button onClick={addBookmark}>Add Bookmark</Button>
          </div>
        </Card>
      </Modal>

      {/* Note Modal */}
      <Modal open={showNoteModal} onClose={() => setShowNoteModal(false)}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add Note</h3>
          <Input
            placeholder="Note content"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={addNote}>Add Note</Button>
          </div>
        </Card>
      </Modal>
    </div>
  )
}