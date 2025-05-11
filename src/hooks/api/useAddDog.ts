import { useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRevalidator } from "react-router-dom";
import { createDog } from "../../services/dogs";
import { UserContext } from "../../context/UserContext";
import { Dog } from "../../types/dog";
import { queryClient } from "../../services/react-query";

const useAddDog = (onAddDog?: (dogId?: string) => void) => {
  const { userId } = useContext(UserContext);
  const { revalidate } = useRevalidator();

  const { mutateAsync: addDog } = useMutation({
    mutationFn: (data: Omit<Dog, 'id'>) => createDog({ ...data }),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogs', userId],
      });
      revalidate();
    },
    onSettled: (data) => {
      if (onAddDog) {
        onAddDog(data);
      }
    },
  });

  return { addDog };
}

export { useAddDog };