import { UserContext } from '../context/UserContext';
import { useContext } from 'react';
import { Loader } from '../components/Loader';
import styles from './EmailCallback.module.scss';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';

const EmailCallback = () => {
  const { t } = useTranslation();
  const { user } = useContext(UserContext);

  if (user) {
    return (
      <div className={styles.container}>
        <h1>{t('emailCallback.title')}</h1>
        <p>{t('emailCallback.verified')}</p>
        <p>{t('emailCallback.closeTab')}</p>
        <div className={styles.buttonsContainer}>
          <Button>
            <a href="com.klavhub://login" className={styles.appLink}>
              {t('emailCallback.openApp')}
            </a>
          </Button>
          <Button variant="secondary">
            <Link to={`/profile/${user.id}`} className={styles.link}>
              {t('emailCallback.continueHere')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Loader
      style={{
        height: '100dvh',
      }}
    />
  );
};

export { EmailCallback };
