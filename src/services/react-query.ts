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

const clearPrivateDogImageQueries = () => {
  // Signed URLs are private credentials and must not survive an identity change.
  queryClient.removeQueries({
    predicate: ({ queryKey }) =>
      queryKey[0] === 'dogImage' || queryKey[0] === 'dogImages',
  });
};

export { queryClient, clearPrivateDogImageQueries };
