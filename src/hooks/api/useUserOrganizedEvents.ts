import { useQuery } from '@tanstack/react-query';
import { fetchUserOrganizedEvents } from '../../services/events';
import { ONE_MINUTE } from '../../utils/consts';

const useUserOrganizedEvents = (userId: string | null) => {
  const { data: organizedEvents, isLoading: isLoadingOrganizedEvents } =
    useQuery({
      queryKey: ['events', 'organized', userId, 'list'],
      queryFn: fetchUserOrganizedEvents,
      staleTime: ONE_MINUTE,
      enabled: !!userId,
    });

  return { organizedEvents, isLoadingOrganizedEvents };
};

export { useUserOrganizedEvents };
