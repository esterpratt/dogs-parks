import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';
import styles from './DeleteAcount.module.scss';

// You can delete your full account and all associated data from inside the app:

// Go to your Profile

// Tap Settings > Delete Account

// This will permanently remove your account and all related data.

// Delete specific data (e.g., your dog)
// If you'd prefer to remove only part of your data, such as your dog’s profile:

// Open your Profile

// Tap on your dog’s profile

// Tap Delete Dog

// This removes the dog’s information without deleting your entire account.

const DeleteAcount = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.wrapper}>
      <h1>{t('deleteAccount.title')}</h1>
      <div className={styles.section}>
        <h2>{t('deleteAccount.fullDeleteTitle')}</h2>
        <p>1. {t('deleteAccount.fullDeleteStep1')}</p>
        <p>2. {t('deleteAccount.fullDeleteStep2')}</p>
        <p>3. {t('deleteAccount.fullDeleteStep3')}</p>
        <p>{t('deleteAccount.fullDeleteNote')}</p>
      </div>
      <div className={styles.section}>
        <h2>{t('deleteAccount.deleteDogTitle')}</h2>
        <p>1. {t('deleteAccount.deleteDogStep1')}</p>
        <p>2. {t('deleteAccount.deleteDogStep2')}</p>
        <p>3. {t('deleteAccount.deleteDogStep3')}</p>
        <p>4. {t('deleteAccount.deleteDogStep4')}</p>
        <p>5. {t('deleteAccount.deleteDogStep5')}</p>
        <p>{t('deleteAccount.deleteDogBody')}</p>
      </div>
      <div className={styles.section}>
        <p>
          {t('deleteAccount.help')}{' '}
          <a href="mailto:esterpratt@gmail.com">
            <Button variant="simple" className={styles.button}>
              {t('deleteAccount.helpEmail')}
            </Button>
          </a>
        </p>
      </div>
    </div>
  );
};

export default DeleteAcount;
