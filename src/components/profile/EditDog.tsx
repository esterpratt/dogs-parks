import { ChangeEvent, FormEvent, useContext, useEffect, useState } from 'react';
import { Dog } from '../../types/dog';
import { Button } from '../Button';
import styles from './EditDog.module.scss';
import { ControlledInput } from '../ControlledInput';
import { createDog, updateDog } from '../../services/dogs';
import { UserContext } from '../../context/UserContext';

interface EditDogProps {
  dog?: Dog;
  onSubmitForm?: () => void;
}

// TODO: create context / lift state up
// so the state will include the data from each dog without overriding
const EditDog: React.FC<EditDogProps> = ({ dog, onSubmitForm }) => {
  const [dogData, setDogData] = useState<
    | (Pick<Dog, 'name' | 'age' | 'breed' | 'size'> &
        Partial<
          Omit<Dog, 'likes' | 'dislikes'> & { likes: string; dislikes: string }
        >)
    | null
  >(null);
  const { userId } = useContext(UserContext);

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
    event: ChangeEvent<HTMLInputElement>,
    value?: string | number
  ) => {
    setDogData((prev) => {
      return {
        ...prev,
        [event.target.name]: value || event.target.value,
      };
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const likes = dogData?.likes?.split(', ') || [];
    const dislikes = dogData?.dislikes?.split(', ') || [];
    const age = Number(dogData?.age);

    if (dog) {
      await updateDog({
        dogId: dog.id,
        dogDetails: { ...dogData, age, likes, dislikes },
      });
    } else {
      await createDog({ owner: userId!, ...dogData, age, likes, dislikes });
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
        label="Name:"
        variant="singleLine"
        required
      />
      <ControlledInput
        value={dogData?.age?.toString() || ''}
        onChange={onInputChange}
        name="age"
        label="Age:"
        variant="singleLine"
        required
      />
      <ControlledInput
        value={dogData?.breed || ''}
        onChange={onInputChange}
        name="breed"
        label="Breed:"
        variant="singleLine"
        required
      />
      {/* TODO: should be closed options */}
      <ControlledInput
        value={dogData?.size || ''}
        onChange={onInputChange}
        name="size"
        label="size:"
        variant="singleLine"
        required
      />
      <ControlledInput
        value={dogData?.temperament || ''}
        onChange={onInputChange}
        name="temperament"
        label="Temperament"
      />
      {/* TODO: should be closed options */}
      <ControlledInput
        value={dogData?.energy || ''}
        onChange={onInputChange}
        name="energy"
        label="Energy"
      />
      <ControlledInput
        value={dogData?.possessive || ''}
        onChange={onInputChange}
        name="possessive"
        label="Possessive"
      />
      {/* TODO: each like should be apart with option to add another like */}
      <ControlledInput
        value={dogData?.likes || ''}
        onChange={onInputChange}
        name="likes"
        label="Likes"
      />
      {/* TODO: each dislike should be apart with option to add another dislike */}
      <ControlledInput
        value={dogData?.dislikes || ''}
        onChange={onInputChange}
        name="dislikes"
        label="Dislikes"
      />
      {/* TODO: should be textarea of few lines (set max chars) */}
      <ControlledInput
        value={dogData?.description || ''}
        onChange={onInputChange}
        name="description"
        label="Description"
      />
      <Button type="submit" className={styles.saveButton}>
        Save
      </Button>
    </form>
  );
};

export { EditDog };
