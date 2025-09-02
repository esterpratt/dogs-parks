import { useMutation } from '@tanstack/react-query';
import { addParkConditionObservation } from '../../services/park-conditions';
import { ParkCondition, ParkConditionStatus } from '../../types/parkCondition';
import { queryClient } from '../../services/react-query';

interface AddParkConditionObservationParams {
  parkId: string;
  condition: ParkCondition;
  status: ParkConditionStatus;
}

const useAddParkCondition = () => {
  return useMutation({
    mutationFn: (params: AddParkConditionObservationParams) =>
      addParkConditionObservation(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['park-conditions', variables.parkId],
      });
    },
  });
};

export { useAddParkCondition };
