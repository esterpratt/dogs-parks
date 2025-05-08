import { FormEvent, useContext, useEffect, useState } from 'react';
import classnames from 'classnames';
import { Button } from '../components/Button';
import { UserContext } from '../context/UserContext';
import { updatePassword } from '../services/authentication';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/inputs/Input';
import styles from './UpdatePassword.module.scss';
import { useNotification } from '../context/NotificationContext';

const UpdatePassword = () => {
  const [error, setError] = useState('');
  const { userId, isLoadingAuthUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { notify } = useNotification();

  useEffect(() => {
    setError('');
  }, [setError]);

  useEffect(() => {
    if (!isLoadingAuthUser && !userId) {
      navigate('/login?mode=login');
    }
  }, [userId, isLoadingAuthUser, navigate]);

  const { mutate: resetPassword, isPending: isLoadingResetPassword } =
    useMutation({
      mutationFn: (newPassword: string) => updatePassword(newPassword),
      onError: (error) => {
        setError(error.message);
      },
      onSuccess: () => {
        notify('Your password has been updated!');
      },
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = Object.fromEntries(
      new FormData(event.currentTarget)
    ) as unknown as { password: string };
    if (!formData.password) {
      setError('Please enter a new password');
    } else {
      resetPassword(formData.password);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.title}>
          <div className={classnames(styles.error, error ? styles.show : '')}>
            {error}
          </div>
          <span
            className={classnames(
              styles.loading,
              isLoadingResetPassword && styles.show
            )}
          >
            Paws a sec...
          </span>
        </div>
        <form onSubmit={handleSubmit} className={styles.inputsContainer}>
          <Input
            onChange={() => setError('')}
            name="password"
            placeholder="Enter new password"
            type="password"
          />
          <Button type="submit" className={styles.button}>
            Change Passowrd
          </Button>
        </form>
      </div>
    </>
  );
};

export default UpdatePassword;
