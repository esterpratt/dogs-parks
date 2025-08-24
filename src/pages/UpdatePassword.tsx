import { FormEvent, useContext, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { Button } from '../components/Button';
import { updatePassword } from '../services/authentication';
import { useMutation } from '@tanstack/react-query';
import { Input } from '../components/inputs/Input';
import styles from './UpdatePassword.module.scss';
import { supabase } from '../services/supabase-client';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const UpdatePassword = () => {
  const { user } = useContext(UserContext);
  const [error, setError] = useState('');
  const [isUpdated, setIsUpdated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(() => {
          setAccessToken(access_token);
          setRefreshToken(refresh_token);
        })
        .catch((err) => {
          console.error(
            'Failed to restore session from password reset link',
            err
          );
          setError(
            'This reset link is invalid or expired. Please request a new one.'
          );
        });
    }
  }, []);

  const { mutate: resetPassword, isPending: isLoadingResetPassword } =
    useMutation({
      mutationFn: (newPassword: string) => updatePassword(newPassword),
      onError: (error) => {
        setError(error.message);
      },
      onSuccess: () => {
        setIsUpdated(true);
        setError('');
      },
    });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get('password') as string;

    if (!password) {
      setError('Please enter a new password');
    } else {
      resetPassword(password);
    }
  };

  if (isUpdated && user) {
    const deepLink =
      user && accessToken && refreshToken
        ? 'com.klavhub://auth-callback' +
          `#access_token=${accessToken}&refresh_token=${refreshToken}`
        : 'com.klavhub://login';

    return (
      <div className={styles.successContainer}>
        <h1>Good boy!</h1>
        <p>Your password has been updated.</p>
        <p>You can now return to the app and continue your adventure.</p>
        <div className={styles.buttonsContainer}>
          <Button>
            <a href={deepLink} className={styles.appLink}>
              Open the app
            </a>
          </Button>
          <Button variant="secondary">
            <Link to={`/profile/${user?.id}`} className={styles.link}>
              Continue here
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
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
          ref={passwordRef}
          onChange={() => setError('')}
          name="password"
          placeholder="Enter new password"
          type="password"
        />
        <Button type="submit" className={styles.button}>
          Update password
        </Button>
      </form>
    </div>
  );
};

export default UpdatePassword;
