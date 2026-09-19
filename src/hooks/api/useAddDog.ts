import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useRevalidator } from 'react-router-dom';
import { createDog } from '../../services/dogs';
import { UserContext } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import { Dog } from '../../types/dog';
import { queryClient } from '../../services/react-query';

const useAddDog = (onAddDog?: (dogId?: string) => void) => {
  const { userId } = useContext(UserContext);
  const { revalidate } = useRevalidator();
  const { notify } = useNotification();
  const { t } = useTranslation();

  const { mutate: addDog, isPending: isPendingAddDog } = useMutation({
    mutationFn: (data: Omit<Dog, 'id'>) => createDog({ ...data }),
    onError: () => {
      notify(t('toasts.generic.error'), true);
    },
    onSuccess: (dogId) => {
      queryClient.invalidateQueries({
        queryKey: ['dogs', userId],
      });
      revalidate();

      // Notify the caller only when the dog was created successfully.
      onAddDog?.(dogId);
    },
  });

  return { addDog, isPendingAddDog };
};

export { useAddDog };
