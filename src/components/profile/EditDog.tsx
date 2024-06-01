import { ChangeEvent, FormEvent, useContext, useEffect, useState } from 'react';
import { Dog, DOG_ENERGY, DOG_SIZE, GENDER } from '../../types/dog';
import { Button } from '../Button';
import styles from './EditDog.module.scss';
import { ControlledInput } from '../inputs/ControlledInput';
import {
  createDog,
  updateDog,
  EditDogProps as UpdateDogProps,
} from '../../services/dogs';
import { UserContext } from '../../context/UserContext';
import { RadioInputs } from '../inputs/RadioInputs';
import { TextArea } from '../inputs/TextArea';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../services/react-query';
import { useRevalidator } from 'react-router';
import { ThankYouModalContext } from '../../context/ThankYouModalContext';

interface EditDogProps {
  dog?: Dog;
  onSubmitForm?: () => void;
}

const EditDog: React.FC<EditDogProps> = ({ dog, onSubmitForm }) => {
  const { setIsOpen: setIsThankYouModalOpen } =
    useContext(ThankYouModalContext);
  const [dogData, setDogData] = useState<
    | (Partial<Omit<Dog, 'likes' | 'dislikes'>> &
        Required<Pick<Dog, 'name'>> & {
          likes?: string;
          dislikes?: string;
        })
    | null
  >(null);
  const { userId } = useContext(UserContext);
  const { revalidate } = useRevalidator();

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
    onError: (error, vars, context) => {
      queryClient.setQueryData(['dogs', vars.dogId], context?.prevDog);
    },
    onSuccess: () => {
      setIsThankYouModalOpen(true);
    },
    onSettled: (data, error, vars) => {
      queryClient.invalidateQueries({ queryKey: ['dogs', vars.dogId] });
      queryClient.invalidateQueries({ queryKey: ['dogs', userId] });
      revalidate();
    },
  });

  const { mutate: addDog } = useMutation({
    mutationFn: (data: Omit<Dog, 'id'>) => createDog({ ...data }),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogs', userId],
      });
      revalidate();
    },
  });

  useEffect(() => {
    if (dog) {
      setDogData({
        ...dog,
        likes: dog.likes?.join(', '),
        dislikes: dog.dislikes?.join(', '),
      });
    } else {
      setDogData(null);
    }
  }, [dog]);

  const onInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string | number
  ) => {
    setDogData((prev) => {
      return {
        ...prev,
        [event.target.name]: value || event.target.value,
      };
    });
  };

  // TODO: move to action?
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const likes = dogData!.likes?.split(', ') || [];
    const dislikes = dogData!.dislikes?.split(', ') || [];
    const age = Number(dogData!.age);

    if (dog) {
      mutateDog({
        dogId: dog.id,
        dogDetails: { ...dogData, age, likes, dislikes },
      });
    } else {
      addDog({
        owner: userId!,
        ...dogData!,
        age,
        likes,
        dislikes,
      });
    }
    if (onSubmitForm) {
      onSubmitForm();
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <ControlledInput
        value={dogData?.name || ''}
        onChange={onInputChange}
        name="name"
        label="Name"
        required
      />
      <RadioInputs
        value={dogData?.gender || ''}
        options={[
          { value: GENDER.FEMALE, id: GENDER.FEMALE },
          { value: GENDER.MALE, id: GENDER.MALE },
        ]}
        onOptionChange={onInputChange}
        name="gender"
      />
      <ControlledInput
        value={dogData?.age?.toString() || ''}
        onChange={onInputChange}
        name="age"
        label="Age"
        required
      />
      <ControlledInput
        value={dogData?.breed || ''}
        onChange={onInputChange}
        name="breed"
        label="Breed"
        required
      />
      <RadioInputs
        value={dogData?.size || ''}
        options={[
          { value: DOG_SIZE.LARGE, id: DOG_SIZE.LARGE },
          { value: DOG_SIZE.MEDIUM, id: DOG_SIZE.MEDIUM },
          { value: DOG_SIZE.SMALL, id: DOG_SIZE.SMALL },
        ]}
        onOptionChange={onInputChange}
        name="size"
      />
      <ControlledInput
        value={dogData?.temperament || ''}
        onChange={onInputChange}
        name="temperament"
        label="Temperament"
      />
      <RadioInputs
        value={dogData?.energy || ''}
        options={[
          { value: DOG_ENERGY.HIGH, id: DOG_ENERGY.HIGH },
          { value: DOG_ENERGY.MEDIUM, id: DOG_ENERGY.MEDIUM },
          { value: DOG_ENERGY.LOW, id: DOG_ENERGY.LOW },
        ]}
        onOptionChange={onInputChange}
        name="energy"
      />
      <ControlledInput
        value={dogData?.possessive || ''}
        onChange={onInputChange}
        name="possessive"
        label="Possessive"
      />
      {/* TODO: each like and dislike should be apart with option to add another like */}
      <ControlledInput
        value={dogData?.likes || ''}
        onChange={onInputChange}
        name="likes"
        label="Likes"
      />
      <ControlledInput
        value={dogData?.dislikes || ''}
        onChange={onInputChange}
        name="dislikes"
        label="Dislikes"
      />
      <TextArea
        rows={9}
        maxLength={330}
        value={dogData?.description || ''}
        onChange={onInputChange}
        name="description"
        label="Description"
      />
      <Button variant="green" type="submit" className={styles.saveButton}>
        Save
      </Button>
    </form>
  );
};

export { EditDog };
