import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min → no refetch spam
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
      retryDelay: 800, // 800ms → avoid spamming the server with retries in case of failure
    }
  }
})