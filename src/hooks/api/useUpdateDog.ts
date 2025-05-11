import { useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRevalidator } from 'react-router-dom';
import {
  updateDog,
  EditDogProps as UpdateDogProps,
} from '../../services/dogs';
import { queryClient } from "../../services/react-query";
import { useNotification } from "../../context/NotificationContext";
import { UserContext } from "../../context/UserContext";
import { Dog } from "../../types/dog";

const useUpdateDog = () => {
  const { notify } = useNotification();
  const { revalidate } = useRevalidator();
  const { userId } = useContext(UserContext);

  const { mutate: mutateDog } = useMutation({
    mutationFn: (data: UpdateDogProps) =>
      updateDog({ dogId: data.dogId, dogDetails: data.dogDetails }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['dogs', vars.dogId] });
      const prevDog = queryClient.getQueryData<Dog>(['dogs', vars.dogId]);
      queryClient.setQueryData(['dogs', vars.dogId], {
        ...prevDog,
        ...vars.dogDetails,
      });
      return { prevDog };
    },
    onError: (_error, vars, context) => {
      queryClient.setQueryData(['dogs', vars.dogId], context?.prevDog);
    },
    onSuccess: () => {
      notify();
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: ['dogs', vars.dogId] });
      queryClient.invalidateQueries({ queryKey: ['dogs', userId] });
      revalidate();
    },
  });

  return { mutateDog };
}

export { useUpdateDog }