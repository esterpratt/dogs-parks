import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useRevalidator } from 'react-router-dom';
import {
  updateDog,
  EditDogProps as UpdateDogProps,
} from '../../services/dogs';
import { queryClient } from '../../services/react-query';
import { useNotification } from '../../context/NotificationContext';
import { UserContext } from '../../context/UserContext';
import { Dog } from '../../types/dog';

const useUpdateDog = () => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const { revalidate } = useRevalidator();
  const { userId } = useContext(UserContext);

  const { mutate: mutateDog, isPending: isPendingUpdateDog } = useMutation({
    mutationFn: (data: UpdateDogProps) =>
      updateDog({
        dogId: data.dogId,
        dogDetails: data.dogDetails,
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ['dogs', variables.dogId],
      });

      const previousDog = queryClient.getQueryData<Dog>([
        'dogs',
        variables.dogId,
      ]);

      queryClient.setQueryData(['dogs', variables.dogId], {
        ...previousDog,
        ...variables.dogDetails,
      });

      return { previousDog };
    },
    onError: (_error, variables, context) => {
      // Restore the cached dog and expose the failed update to the user.
      queryClient.setQueryData(
        ['dogs', variables.dogId],
        context?.previousDog
      );
      notify(t('toasts.generic.error'), true);
    },
    onSuccess: () => {
      notify();
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['dogs', variables.dogId],
      });
      queryClient.invalidateQueries({ queryKey: ['dogs', userId] });
      revalidate();
    },
  });

  return { mutateDog, isPendingUpdateDog };
};

export { useUpdateDog };
