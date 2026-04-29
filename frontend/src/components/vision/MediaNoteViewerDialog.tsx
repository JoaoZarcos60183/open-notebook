'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/hooks/use-translation'
import { getApiUrl } from '@/lib/config'

/**
 * Normalize a stored note-asset URL to a path-only form (e.g.
 * "/api/vision/note-asset/<file>"). Older notes embed an absolute URL
 * such as "http://localhost:5055/api/vision/note-asset/..." which only
 * works when the browser runs on the same host as the API server.
 * Returning the path lets the consumer prefix the live API base URL.
 *
 * Data URLs are returned unchanged.
 */
function normalizeAssetUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('data:')) return url
  const idx = url.indexOf('/api/vision/note-asset/')
  if (idx >= 0) return url.slice(idx)
  return url
}

/**
 * React hook that resolves a normalized note-asset URL into a fully
 * qualified URL using the live API base. Data URLs and already absolute
 * URLs are returned as-is.
 */
function useResolvedAssetUrl(mediaUrl: string): string {
  const [resolved, setResolved] = useState<string>(mediaUrl)
  useEffect(() => {
    let cancelled = false
    if (!mediaUrl || mediaUrl.startsWith('data:') || /^https?:\/\//i.test(mediaUrl)) {
      setResolved(mediaUrl)
      return
    }
    if (mediaUrl.startsWith('/')) {
      getApiUrl()
        .then((api) => {
          if (!cancelled) setResolved(`${api}${mediaUrl}`)
        })
        .catch(() => {
          if (!cancelled) setResolved(mediaUrl)
        })
    } else {
      setResolved(mediaUrl)
    }
    return () => {
      cancelled = true
    }
  }, [mediaUrl])
  return resolved
}

interface MediaNoteViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string | null
  /** "image" or "video" — determines how the asset is rendered. */
  kind: 'image' | 'video'
  /** Absolute or relative URL to the media asset. */
  mediaUrl: string
  /** Plain analysis text shown below the media. */
  analysisText: string
}

/**
 * Read-only viewer for notes whose content is an image or video asset
 * produced by the "Add to Notebook" flow on the vision pages. Shows the
 * media at full size plus the analysis text — no editing affordances.
 */
export function MediaNoteViewerDialog({
  open,
  onOpenChange,
  title,
  kind,
  mediaUrl,
  analysisText,
}: MediaNoteViewerDialogProps) {
  const { t } = useTranslation()
  const resolvedUrl = useResolvedAssetUrl(mediaUrl)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogTitle className="border-b px-6 py-4 text-lg font-semibold">
          {title || t.common.notes}
        </DialogTitle>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedUrl}
              alt={title || ''}
              className="max-w-full h-auto rounded-md border"
            />
          ) : (
            <video
              src={resolvedUrl}
              controls
              className="max-w-full h-auto rounded-md border"
            />
          )}

          {analysisText.trim() && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {analysisText.trim()}
            </p>
          )}
        </div>

        <div className="border-t px-6 py-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Inspect a note's content and, if it embeds an image or video produced by
 * the vision "Add to Notebook" flow, return the parts needed to render a
 * read-only viewer.
 *
 * Supports both formats:
 *   - the current format: ``![title](http://.../api/vision/note-asset/<file>)``
 *     for images and ``[▶ title](.../note-asset/<file>.mp4)`` for videos;
 *   - the legacy format: an inline base64 ``data:image/...`` markdown image
 *     or an ``<video src="data:video/...">`` HTML tag.
 *
 * Returns ``null`` for ordinary text notes.
 */
export function detectMediaNote(content: string | null | undefined): {
  kind: 'image' | 'video'
  mediaUrl: string
  analysisText: string
} | null {
  if (!content) return null

  // ── Image: any markdown ``![alt](url)`` whose URL is either a stored
  //    note-asset file or a base64 data URL.
  const imageMatch = content.match(
    /!\[[^\]]*\]\((\S*\/api\/vision\/note-asset\/[^)\s]+|data:image\/[^)\s]+)\)/,
  )
  if (imageMatch) {
    const mediaUrl = normalizeAssetUrl(imageMatch[1])
    const analysisText = content.replace(imageMatch[0], '').trim()
    return { kind: 'image', mediaUrl, analysisText }
  }

  // ── Video: markdown link to a stored note-asset video file.
  const videoLinkMatch = content.match(
    /\[[^\]]*\]\((\S*\/api\/vision\/note-asset\/[^)\s]+\.(?:mp4|webm|mov))\)/i,
  )
  if (videoLinkMatch) {
    const mediaUrl = normalizeAssetUrl(videoLinkMatch[1])
    const analysisText = content.replace(videoLinkMatch[0], '').trim()
    return { kind: 'video', mediaUrl, analysisText }
  }

  // ── Legacy: ``<video ... src="..."></video>`` (data URL or http URL).
  const videoTagMatch = content.match(
    /<video[^>]*\bsrc=["']([^"']+)["'][^>]*>(?:\s*<\/video>)?/i,
  )
  if (videoTagMatch) {
    const mediaUrl = normalizeAssetUrl(videoTagMatch[1])
    const analysisText = content.replace(videoTagMatch[0], '').trim()
    return { kind: 'video', mediaUrl, analysisText }
  }

  return null
}

export { useResolvedAssetUrl }
