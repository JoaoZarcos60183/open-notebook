'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  useReportTypes,
  useResearchTones,
  useGenerateResearch,
  useResearchJob,
  useSaveResearchAsNote,
} from '@/lib/hooks/use-research'
import { useTranslation } from '@/lib/hooks/use-translation'

interface NotebookResearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notebookId: string
}

export function NotebookResearchDialog({
  open,
  onOpenChange,
  notebookId,
}: NotebookResearchDialogProps) {
  const { t } = useTranslation()

  // Form state
  const [query, setQuery] = useState('')
  const [reportType, setReportType] = useState('research_report')
  const [tone, setTone] = useState('Objective')
  const [useAmalia, setUseAmalia] = useState(true)

  // Job tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [savedAsNote, setSavedAsNote] = useState(false)

  // Hooks
  const { data: reportTypes, isLoading: typesLoading } = useReportTypes()
  const { data: tones, isLoading: tonesLoading } = useResearchTones()
  const generateMutation = useGenerateResearch()
  const saveAsNoteMutation = useSaveResearchAsNote()
  const { data: activeJob } = useResearchJob(activeJobId)

  // Auto-save as note when the job completes
  useEffect(() => {
    if (
      activeJob?.status === 'completed' &&
      activeJob.has_result &&
      !savedAsNote &&
      !saveAsNoteMutation.isPending
    ) {
      setSavedAsNote(true)
      saveAsNoteMutation.mutate({
        research_id: activeJob.id,
        notebook_id: notebookId,
        title: `🔬 ${query.slice(0, 80)}`,
      })
    }
  }, [activeJob, savedAsNote, saveAsNoteMutation, notebookId, query])

  // Reset state when dialog closes
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        // Only allow closing if not mid-research
        if (activeJobId && activeJob?.status !== 'completed' && activeJob?.status !== 'failed') {
          // Research is running — keep dialog open but allow user to force-close
        }
        setQuery('')
        setReportType('research_report')
        setTone('Objective')
        setUseAmalia(true)
        setActiveJobId(null)
        setSavedAsNote(false)
      }
      onOpenChange(nextOpen)
    },
    [activeJobId, activeJob, onOpenChange]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const result = await generateMutation.mutateAsync({
      query: query.trim(),
      report_type: reportType,
      report_source: 'local',
      tone,
      source_urls: [],
      use_amalia: useAmalia,
      run_in_background: true,
      notebook_id: notebookId,
    })

    // Result has job_id when background mode
    if ('job_id' in result) {
      setActiveJobId(result.job_id)
    }
  }

  const isLoading = typesLoading || tonesLoading
  const isSubmitting = generateMutation.isPending
  const isRunning = activeJobId !== null && activeJob?.status !== 'completed' && activeJob?.status !== 'failed'
  const isCompleted = activeJob?.status === 'completed'
  const isFailed = activeJob?.status === 'failed'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t.research?.title ?? 'Research'}
          </DialogTitle>
          <DialogDescription>
            {t.research?.notebookResearchDesc ??
              'Run a deep research and automatically save the result as a note in this notebook.'}
          </DialogDescription>
        </DialogHeader>

        {/* Show progress/status when a job is active */}
        {activeJobId ? (
          <div className="space-y-4 py-4">
            {/* Status indicator */}
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
              {isRunning && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">
                      {t.research?.researchInProgress ?? 'Research in progress...'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeJob?.progress || (t.research?.pleaseWait ?? 'Please wait, this may take a few minutes.')}
                    </p>
                  </div>
                </>
              )}
              {isCompleted && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">
                      {savedAsNote
                        ? (t.research?.savedAsNoteInNotebook ?? 'Research complete — saved as note!')
                        : (t.research?.savingAsNote ?? 'Research complete — saving as note...')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.research?.checkNotesColumn ?? 'Check the Notes column to see the result.'}
                    </p>
                  </div>
                </>
              )}
              {isFailed && (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-sm">
                      {t.research?.researchFailed ?? 'Research failed'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeJob?.error || (t.common?.error ?? 'An error occurred.')}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Query reminder */}
            <div className="p-3 rounded border bg-muted/10">
              <p className="text-xs text-muted-foreground mb-1">
                {t.research?.queryTitle ?? 'Research Query'}
              </p>
              <p className="text-sm">{query}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              {(isCompleted || isFailed) && (
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  {t.common?.close ?? 'Close'}
                </Button>
              )}
              {isFailed && (
                <Button
                  onClick={() => {
                    setActiveJobId(null)
                    setSavedAsNote(false)
                  }}
                >
                  {t.common?.retry ?? 'Retry'}
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Research form */
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Query */}
            <div className="space-y-2">
              <Label>{t.research?.queryTitle ?? 'Research Query'}</Label>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  t.research?.queryPlaceholder ??
                  'e.g., What are the latest developments in maritime autonomous systems?'
                }
                className="min-h-[80px] text-sm"
                disabled={isSubmitting}
              />
            </div>

            {/* Report Type & Tone — side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.research?.reportType ?? 'Report Type'}</Label>
                <Select value={reportType} onValueChange={setReportType} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes?.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reportTypes && (
                  <p className="text-xs text-muted-foreground">
                    {reportTypes.find((rt) => rt.value === reportType)?.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.research?.toneLabel ?? 'Writing Tone'}</Label>
                <Select value={tone} onValueChange={setTone} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones?.map((tn) => (
                      <SelectItem key={tn.value} value={tn.value}>
                        {tn.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amália toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Checkbox
                id="nb-use-amalia"
                checked={useAmalia}
                onCheckedChange={(checked) => setUseAmalia(!!checked)}
                disabled={isSubmitting}
              />
              <div className="space-y-0.5">
                <Label htmlFor="nb-use-amalia" className="text-sm font-medium cursor-pointer">
                  <Sparkles className="h-3.5 w-3.5 inline mr-1" />
                  {t.research?.useAmalia ?? 'Use Amália'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t.research?.amaliaDescription ??
                    'AMALIA-9B — Portuguese-optimized model by NOVASearch'}
                </p>
              </div>
              {useAmalia && (
                <Badge variant="secondary" className="text-xs ml-auto">
                  carminho/AMALIA-9B-50-DPO
                </Badge>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={!query.trim() || isSubmitting || isLoading}
                className="min-w-[180px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.research?.generating ?? 'Generating...'}
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {t.research?.generate ?? 'Generate Research'}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
