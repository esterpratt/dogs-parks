import { FormEvent, useContext, useEffect, useState } from 'react';
import classnames from 'classnames';
import { Button } from '../components/Button';
import { UserContext } from '../context/UserContext';
import { FormInput } from '../components/inputs/FormInput';
import { ThankYouModal } from '../components/ThankYouModal';
import styles from './UpdatePassword.module.scss';
import { updatePassword } from '../services/authentication';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

const UpdatePassowrd = () => {
  const [error, setError] = useState('');
  const { userId, isLoadingAuthUser } = useContext(UserContext);
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
  }, [setError]);

  useEffect(() => {
    if (!isLoadingAuthUser && !userId) {
      navigate('/login');
    }
  }, [userId, isLoadingAuthUser, navigate]);

  const { mutate: resetPassword, isPending: isLoadingResetPassword } =
    useMutation({
      mutationFn: (newPassword: string) => updatePassword(newPassword),
      onError: (error) => {
        setError(error.message);
      },
      onSuccess: () => {
        setIsThankYouModalOpen(true);
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

  const onCloseThankYouModal = () => {
    setIsThankYouModalOpen(false);
    navigate(`/profile/${userId}`);
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
          <div className={styles.inputs}>
            <FormInput
              onChange={() => setError('')}
              name="password"
              label="Enter new password"
              type="password"
            />
          </div>
          <Button variant="green" type="submit" className={styles.button}>
            Change Passowrd
          </Button>
        </form>
      </div>
      <ThankYouModal
        title="Your password has been updated!"
        open={isThankYouModalOpen}
        onClose={onCloseThankYouModal}
        onAfterClose={onCloseThankYouModal}
      />
    </>
  );
};

export { UpdatePassowrd };
