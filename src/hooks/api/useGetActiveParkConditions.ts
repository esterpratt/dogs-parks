import { useQuery } from '@tanstack/react-query';
import { getActiveParkConditions } from '../../services/park-conditions';
import { FIVE_MINUTES } from '../../utils/consts';

const useGetActiveParkConditions = (parkId: string) => {
  return useQuery({
    queryKey: ['park-conditions', parkId],
    queryFn: () => getActiveParkConditions({ parkId }),
    enabled: !!parkId,
    staleTime: FIVE_MINUTES,
  });
};

export { useGetActiveParkConditions };
