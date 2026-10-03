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
    onError: () => {
      // Server-derived capability state is authoritative after a failed edit.
      notify(t('toasts.generic.error'), true);
    },
    onSuccess: () => {
      notify();
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['dogPage', variables.dogId],
      });
      queryClient.invalidateQueries({ queryKey: ['userDogs', userId] });
      revalidate();
    },
  });

  return { mutateDog, isPendingUpdateDog };
};

export { useUpdateDog };
