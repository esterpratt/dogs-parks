import { FormEvent } from 'react';
import { Dog } from '../../types/dog';
import { Button } from '../Button';
import styles from './EditDog.module.scss';
import { FormInput } from '../FormInput';

interface EditDogProps {
  dog?: Dog;
}

const EditDog: React.FC<EditDogProps> = ({ dog }) => {
  const {
    name,
    age,
    breed,
    size,
    temperament,
    energy,
    possessive,
    likes,
    dislikes,
    description,
  } = dog || {};

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    console.log(data);
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <FormInput
        defaultValue={name}
        name="name"
        label="Name:"
        variant="singleLine"
        required
      />
      <FormInput
        defaultValue={age}
        name="age"
        label="Age:"
        variant="singleLine"
        required
      />
      <FormInput
        defaultValue={breed}
        name="breed"
        label="Breed:"
        variant="singleLine"
        required
      />
      {/* TODO: should be closed options */}
      <FormInput
        defaultValue={size}
        name="size"
        label="size:"
        variant="singleLine"
        required
      />
      <FormInput
        defaultValue={temperament}
        name="temperament"
        label="Temperament"
      />
      {/* TODO: should be closed options */}
      <FormInput defaultValue={energy} name="energy" label="Energy" />
      <FormInput
        defaultValue={possessive}
        name="possessive"
        label="Possessive"
      />
      {/* TODO: each like should be apart with option to add another like */}
      <FormInput defaultValue={likes?.join(', ')} name="likes" label="Likes" />
      {/* TODO: each dislike should be apart with option to add another dislike */}
      <FormInput
        defaultValue={dislikes?.join(', ')}
        name="dislikes"
        label="Dislikes"
      />
      {/* TODO: should be textarea of few lines (set max chars) */}
      <FormInput
        defaultValue={description}
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
