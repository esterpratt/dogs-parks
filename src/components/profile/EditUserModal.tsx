import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UserContext } from '../../context/UserContext';
import { Modal } from '../Modal';
import styles from './EditUserModal.module.scss';
import { ThankYouModalContext } from '../../context/ThankYouModalContext';
import {
  updateUser,
  EditUserProps as UpdateUserProps,
} from '../../services/users';
import { queryClient } from '../../services/react-query';
import { User } from '../../types/user';
import { ControlledInput } from '../inputs/ControlledInput';
import { Checkbox } from '../inputs/Checkbox';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, refetchUser } = useContext(UserContext);
  const [userData, setUserData] = useState(user);
  const { setIsOpen: setIsThankYouModalOpen } =
    useContext(ThankYouModalContext);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const { mutate: mutateUser } = useMutation({
    mutationFn: (data: UpdateUserProps) =>
      updateUser({
        userId: data.userId,
        userDetails: data.userDetails,
      }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['user', 'me', user!.id] });
      const prevUser = queryClient.getQueryData<User>(['user', 'me', user!.id]);
      queryClient.setQueryData(['users', user!.id], {
        ...prevUser,
        ...data.userDetails,
      });
      return { prevUser };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(['user', 'me', user!.id], context?.prevUser);
    },
    onSuccess: () => {
      setIsThankYouModalOpen(true);
    },
    onSettled: () => {
      refetchUser();
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
      } as User;
    });
  };

  const onPrivacyChange = () => {
    setUserData((prev) => {
      return {
        ...prev,
        private: !prev?.private,
      } as User;
    });
  };

  const onSubmit = async () => {
    mutateUser({ userId: user!.id, userDetails: userData! });
    onClose();
  };

  if (!user) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      height="50%"
      onSave={onSubmit}
      saveButtonDisabled={!userData?.name}
      className={styles.contentContainer}
    >
      <div className={styles.title}>Update your details</div>
      <form className={styles.form}>
        <ControlledInput
          value={userData?.name || ''}
          onChange={onInputChange}
          name="name"
          label="Name"
          required
        />
        <div className={styles.privacyContainer}>
          <Checkbox
            id="visibility"
            label="Hide me"
            onChange={onPrivacyChange}
            isChecked={userData?.private ?? false}
          />
          <span>
            * If you are hidden, you won’t appear in search results. Only your
            friends or users you have sent friend requests to will be able to
            see your page.
          </span>
        </div>
      </form>
    </Modal>
  );
};
