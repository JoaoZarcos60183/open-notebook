// Research types for the NOVA-Researcher integration

export type ResearchStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ReportTypeInfo {
  value: string
  label: string
  description: string
}

export interface ToneInfo {
  value: string
  label: string
  description: string
}

export interface SourceInfo {
  value: string
  label: string
  description: string
}

export interface ResearchGenerateRequest {
  query: string
  report_type: string
  report_source: string
  tone: string
  source_urls: string[]
  notebook_id?: string | null
  use_amalia: boolean
  run_in_background: boolean
}

export interface ResearchJobSubmitResponse {
  job_id: string
  status: string
  message: string
}

export interface ResearchResultData {
  report: string
  source_urls: string[]
  research_costs: number
  images: string[]
}

export interface ResearchJob {
  id: string
  query: string
  report_type: string
  status: ResearchStatus
  progress: string
  created_at: string
  error?: string | null
  has_result?: boolean
  result?: ResearchResultData | null
}

export interface ResearchSyncResult {
  id: string
  query: string
  report_type: string
  report: string
  source_urls: string[]
  research_costs: number
  images: string[]
  status: string
  created_at: string
  error?: string | null
}

export interface SaveAsNoteRequest {
  research_id: string
  notebook_id: string
  title?: string
}

export interface SaveAsNoteResponse {
  success: boolean
  note_id: string
  message: string
}

// Status helpers
export const ACTIVE_RESEARCH_STATUSES: ResearchStatus[] = ['pending', 'running']

export function isResearchActive(status: ResearchStatus): boolean {
  return ACTIVE_RESEARCH_STATUSES.includes(status)
}
