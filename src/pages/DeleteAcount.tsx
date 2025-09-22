import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';
import styles from './DeleteAcount.module.scss';

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
