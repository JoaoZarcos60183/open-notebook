import apiClient from "./client";
import { getApiUrl } from "@/lib/config";
import { SearchRequest, SearchResponse, AskRequest } from "@/lib/types/search";

export const searchApi = {
  // Standard search (non-streaming)
  search: async (params: SearchRequest) => {
    const response = await apiClient.post<SearchResponse>("/search", params);
    return response.data;
  },

  // Ask with streaming — fetches directly from the FastAPI backend
  // to avoid Next.js rewrite proxy which buffers SSE responses.
  askKnowledgeBase: async (params: AskRequest) => {
    // Get auth token using the same logic as apiClient interceptor
    let token = null;
    if (typeof window !== "undefined") {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          if (state?.token) {
            token = state.token;
          }
        } catch (error) {
          console.error("Error parsing auth storage:", error);
        }
      }
    }

    // Resolve the API base URL so we hit the FastAPI backend directly,
    // bypassing the Next.js rewrite proxy that buffers SSE streams.
    // When apiUrl is empty (relative-path mode), derive the backend URL
    // from the current page origin on port 5055.
    let apiUrl = await getApiUrl();
    if (!apiUrl && typeof window !== "undefined") {
      apiUrl = `${window.location.protocol}//${window.location.hostname}:5055`;
    }
    const url = `${apiUrl}/api/search/ask`;

    // Use fetch with ReadableStream for SSE
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      // Try to extract error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If response isn't JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("No response body received");
    }

    return response.body;
  },
};
