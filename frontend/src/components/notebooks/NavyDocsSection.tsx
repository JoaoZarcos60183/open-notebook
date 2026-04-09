'use client'

import { useState, useMemo } from 'react'
import { useNavyDocuments } from '@/lib/hooks/use-navy-docs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Database, Search, Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/use-translation'
import { cn } from '@/lib/utils'

interface NavyDocsSectionProps {
  /** Set of selected doc_ids (all selected by default) */
  selectedDocIds?: Set<string>
  /** Called when user toggles a document */
  onSelectionChange?: (docId: string, selected: boolean) => void
  /** Called to select/deselect all */
  onSelectAll?: (selected: boolean) => void
  /** When true, hide checkboxes and show a read-only catalog */
  readOnly?: boolean
}

export function NavyDocsSection({
  selectedDocIds,
  onSelectionChange,
  onSelectAll,
  readOnly = false,
}: NavyDocsSectionProps) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useNavyDocuments()
  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const documents = data?.documents ?? []

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents
    const q = searchQuery.toLowerCase()
    return documents.filter(
      (d) =>
        d.doc_id.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q) ||
        d.sample_section.toLowerCase().includes(q)
    )
  }, [documents, searchQuery])

  const allSelected = !readOnly && documents.length > 0 && documents.every((d) => selectedDocIds?.has(d.doc_id))
  const someSelected = !readOnly && documents.some((d) => selectedDocIds?.has(d.doc_id))

  if (isLoading) {
    return (
      <div className="border rounded-lg p-3 mt-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t.navyDocs?.loading ?? 'Loading corpus documents...'}</span>
        </div>
      </div>
    )
  }

  if (error || !documents.length) {
    return null // Don't show the section if no navy docs available
  }

  return (
    <div className="border rounded-lg mt-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-3 hover:bg-accent/50 rounded-t-lg transition-colors">
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <Database className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">
                {t.navyDocs?.title ?? 'Knowledge Base'}
              </span>
              <Badge variant="secondary" className="text-xs">
                {readOnly
                  ? `${documents.length}`
                  : `${selectedDocIds?.size ?? 0}/${documents.length}`}
              </Badge>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {/* Select all / search */}
            <div className="flex items-center gap-2">
              {!readOnly && onSelectAll && (
                <>
                  <Checkbox
                    id="navy-select-all"
                    checked={allSelected}
                    // indeterminate state when some but not all selected
                    {...(!allSelected && someSelected ? { 'data-state': 'indeterminate' } : {})}
                    onCheckedChange={(checked) => onSelectAll(!!checked)}
                  />
                  <label htmlFor="navy-select-all" className="text-xs text-muted-foreground cursor-pointer">
                    {t.navyDocs?.selectAll ?? 'Select all'}
                  </label>
                </>
              )}
              <div className="flex-1" />
              <div className="relative w-40">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder={t.navyDocs?.filter ?? 'Filter...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-7 text-xs"
                />
              </div>
            </div>

            {/* Document list */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredDocs.map((doc) => {
                const isSelected = selectedDocIds?.has(doc.doc_id) ?? false
                // Format a readable label from the doc_id
                const label = doc.doc_id
                  .replace(/_/g, ' ')
                  .replace(/\.pdf$/i, '')

                return (
                  <div
                    key={doc.doc_id}
                    className={cn(
                      "flex items-start gap-2 px-2 py-1.5 rounded transition-colors",
                      readOnly ? "" : "hover:bg-accent/50 cursor-pointer"
                    )}
                  >
                    {!readOnly && onSelectionChange && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectionChange(doc.doc_id, !!checked)}
                        className="mt-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={doc.doc_id}>
                        {label}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
