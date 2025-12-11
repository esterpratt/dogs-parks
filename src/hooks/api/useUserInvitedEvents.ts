import { useQuery } from '@tanstack/react-query';
import { fetchUserInvitedEvents } from '../../services/events';
import { ONE_MINUTE } from '../../utils/consts';

const useUserInvitedEvents = (userId: string | null) => {
  const { data: invitedEvents, isLoading: isLoadingInvitedEvents } = useQuery({
    queryKey: ['events', 'invited', userId, 'list'],
    queryFn: fetchUserInvitedEvents,
    staleTime: ONE_MINUTE,
    enabled: !!userId,
  });

  return { invitedEvents, isLoadingInvitedEvents };
};

export { useUserInvitedEvents };
