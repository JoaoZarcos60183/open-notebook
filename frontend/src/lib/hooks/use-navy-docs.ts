import { useQuery } from '@tanstack/react-query'
import { navyDocsApi } from '@/lib/api/navy-docs'

export const NAVY_DOCS_QUERY_KEY = ['navy-docs'] as const

export function useNavyDocuments() {
  return useQuery({
    queryKey: NAVY_DOCS_QUERY_KEY,
    queryFn: () => navyDocsApi.list(),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  })
}
