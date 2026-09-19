import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useRevalidator } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import {
  updateUser,
  EditUserProps as UpdateUserProps,
} from '../../services/users';
import { queryClient } from '../../services/react-query';
import { User } from '../../types/user';
import { ControlledInput } from '../inputs/ControlledInput';
import { Checkbox } from '../inputs/Checkbox';
import { useOrientationContext } from '../../context/OrientationContext';
import { FormModal } from '../modals/FormModal';
import styles from './EditUserModal.module.scss';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = (props) => {
  const { isOpen, onClose } = props;
  const { user } = useContext(UserContext);
  const { revalidate } = useRevalidator();
  const [userData, setUserData] = useState(user);
  const { notify } = useNotification();
  const orientation = useOrientationContext((state) => state.orientation);
  const { t } = useTranslation();

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const { mutate: mutateUser, isPending } = useMutation({
    mutationFn: (data: UpdateUserProps) =>
      updateUser({
        userId: data.userId,
        userDetails: data.userDetails,
      }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['user', user!.id] });
      const previousUser = queryClient.getQueryData<User>(['user', user!.id]);

      queryClient.setQueryData(['user', user!.id], {
        ...previousUser,
        ...data.userDetails,
      });

      return { previousUser };
    },
    onError: (_error, _data, context) => {
      // Restore the cached user and keep the modal open when the update fails.
      queryClient.setQueryData(['user', user!.id], context?.previousUser);
      notify(t('toasts.generic.error'), true);
    },
    onSuccess: () => {
      // Close only after the server confirms the profile update.
      notify();
      onClose();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', user!.id] });
      revalidate();
    },
  });

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserData((previousUserData) => {
      return {
        ...previousUserData,
        [event.target.name]: event.target.value,
      } as User;
    });
  };

  const onPrivacyChange = () => {
    setUserData((previousUserData) => {
      return {
        ...previousUserData,
        private: !previousUserData?.private,
      } as User;
    });
  };

  const onSubmit = () => {
    if (!userData || isPending) {
      return;
    }

    mutateUser({
      userId: user!.id,
      userDetails: userData,
    });
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
      isPending={isPending}
      className={styles.modal}
      title={t('settings.edit.titleUpdate')}
    >
      <form className={styles.form}>
        <ControlledInput
          value={userData?.name || ''}
          onChange={onInputChange}
          name="name"
          label={t('settings.edit.labels.name')}
          required
        />
        <div className={styles.privacyContainer}>
          <Checkbox
            id="visibility"
            label={t('settings.edit.privacy.hideMe')}
            onChange={onPrivacyChange}
            isChecked={userData?.private ?? false}
          />
          <span>{t('settings.edit.privacy.explanation')}</span>
        </div>
      </form>
    </FormModal>
  );
};

export { EditUserModal };
