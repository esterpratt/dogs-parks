import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRevalidator } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import {
  updateUser,
  EditUserProps as UpdateUserProps,
} from '../../services/users';
import { queryClient } from '../../services/react-query';
import { User } from '../../types/user';
import { ControlledInput } from '../inputs/ControlledInput';
import { Checkbox } from '../inputs/Checkbox';
import { useOrientationContext } from '../../context/OrientationContext';
import { useNotification } from '../../context/NotificationContext';
import { FormModal } from '../modals/FormModal';
import styles from './EditUserModal.module.scss';
import { useTranslation } from 'react-i18next';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useContext(UserContext);
  const { revalidate } = useRevalidator();
  const [userData, setUserData] = useState(user);
  const { notify } = useNotification();
  const orientation = useOrientationContext((state) => state.orientation);
  const { t } = useTranslation();

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
      await queryClient.cancelQueries({ queryKey: ['user', user!.id] });
      const prevUser = queryClient.getQueryData<User>(['user', user!.id]);
      queryClient.setQueryData(['user', user!.id], {
        ...prevUser,
        ...data.userDetails,
      });
      return { prevUser };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(['user', user!.id], context?.prevUser);
    },
    onSuccess: () => {
      notify();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', user!.id] });
      revalidate();
    },
  });

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

  const handleClose = () => {
    setUserData(user);
    onClose();
  };

  if (!user) {
    return null;
  }

  return (
    <FormModal
      open={isOpen}
      onClose={handleClose}
      height={orientation === 'landscape' ? 98 : null}
      onSave={onSubmit}
      disabled={!userData?.name}
      className={styles.modal}
      title={t('userInfo.edit.titleUpdate')}
    >
      <form className={styles.form}>
        <ControlledInput
          value={userData?.name || ''}
          onChange={onInputChange}
          name="name"
          label={t('userInfo.edit.labels.name')}
          required
        />
        <div className={styles.privacyContainer}>
          <Checkbox
            id="visibility"
            label={t('userInfo.edit.privacy.hideMe')}
            onChange={onPrivacyChange}
            isChecked={userData?.private ?? false}
          />
          <span>{t('userInfo.edit.privacy.explanation')}</span>
        </div>
      </form>
    </FormModal>
  );
};
