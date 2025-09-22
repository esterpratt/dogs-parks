import { FormEvent, useContext, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { Button } from '../components/Button';
import { updatePassword } from '../services/authentication';
import { useMutation } from '@tanstack/react-query';
import { Input } from '../components/inputs/Input';
import styles from './UpdatePassword.module.scss';
import { supabase } from '../services/supabase-client';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../context/UserContext';

const UpdatePassword = () => {
  const { t } = useTranslation();
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
          setError(t('updatePassword.invalidLink'));
        });
    }
  }, [t]);

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
      setError(t('updatePassword.pleaseEnterNewPassword'));
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
        <h1>{t('updatePassword.title')}</h1>
        <p>{t('updatePassword.updated')}</p>
        <p>{t('updatePassword.returnApp')}</p>
        <div className={styles.buttonsContainer}>
          <Button>
            <a href={deepLink} className={styles.appLink}>
              {t('updatePassword.openApp')}
            </a>
          </Button>
          <Button variant="secondary">
            <Link to={`/profile/${user?.id}`} className={styles.link}>
              {t('updatePassword.continueHere')}
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
          {t('updatePassword.pawsASec')}
        </span>
      </div>
      <form onSubmit={handleSubmit} className={styles.inputsContainer}>
        <Input
          ref={passwordRef}
          onChange={() => setError('')}
          name="password"
          placeholder={t('updatePassword.placeholderNewPassword')}
          type="password"
        />
        <Button type="submit" className={styles.button}>
          {t('updatePassword.buttonUpdate')}
        </Button>
      </form>
    </div>
  );
};

export default UpdatePassword;
