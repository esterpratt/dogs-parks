import { QueryClient } from '@tanstack/react-query';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DAY_IN_MS,
      gcTime: DAY_IN_MS,
    },
  },
});

export { queryClient };
