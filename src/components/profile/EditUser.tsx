import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Button } from '../Button';
import styles from './EditUser.module.scss';
import { ControlledInput } from '../inputs/ControlledInput';
import { User } from '../../types/user';
import { useMutation } from '@tanstack/react-query';
import {
  updateUser,
  EditUserProps as UpdateUserProps,
} from '../../services/users';
import { queryClient } from '../../services/react-query';

interface EditUserProps {
  user: User;
  onSubmitForm?: () => void;
}

const EditUser: React.FC<EditUserProps> = ({ user, onSubmitForm }) => {
  const [userData, setUserData] = useState(user);

  const { mutate: mutateUser } = useMutation({
    mutationFn: (data: UpdateUserProps) =>
      updateUser({
        userId: data.userId,
        userDetails: data.userDetails,
      }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['users', user.id] });
      const prevUser = queryClient.getQueryData<User>(['users', user.id]);
      queryClient.setQueryData(['users', user.id], {
        ...prevUser,
        ...data.userDetails,
      });
      return { prevUser };
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(['users', user.id], context?.prevUser);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users', user.id] });
    },
  });

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserData((prev) => {
      return {
        ...prev,
        [event.target.name]: event.target.value,
      };
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    mutateUser({ userId: user.id, userDetails: userData });
    if (onSubmitForm) {
      onSubmitForm();
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <ControlledInput
        value={userData.name || ''}
        onChange={onInputChange}
        name="name"
        label="Name"
        required
      />
      <Button type="submit" variant="green" className={styles.saveButton}>
        Save
      </Button>
    </form>
  );
};

export { EditUser };
