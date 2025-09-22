import { useParams } from 'react-router-dom';
import styles from './ShareRedirect.module.scss';
import { isIosFromBrowser } from '../utils/platform';
import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';

const ShareRedirect = () => {
  const { t } = useTranslation();
  const { parkId } = useParams();
  const siteLink = `https://klavhub.com/parks/${parkId}`;
  const downloadLabel = isIosFromBrowser()
    ? t('share.store.appStore')
    : t('share.store.googlePlay');

  const handleOpenApp = () => {
    window.location.href = `com.klavhub://parks/${parkId}`;
  };

  const handleOpenBrowser = () => {
    window.open(siteLink, '_self');
  };

  const handleOpenStore = () => {
    const fallbackLink = isIosFromBrowser()
      ? import.meta.env.VITE_IOS_STORE_APP_LINK || siteLink
      : import.meta.env.VITE_ANDROID_STORE_APP_LINK || siteLink;
    window.open(fallbackLink, '_self');
  };

  return (
    <div className={styles.container}>
      <h1>{t('share.title')}</h1>
      <p>{t('share.subtitle')}</p>

      <div className={styles.buttonsContainer}>
        <Button onClick={handleOpenApp} className={styles.button}>
          {t('share.openInApp')}
        </Button>
        <Button
          variant="secondary"
          onClick={handleOpenStore}
          className={styles.button}
        >
          {t('share.downloadFrom', { store: downloadLabel })}
        </Button>
        <Button
          variant="secondary"
          color={styles.blue}
          onClick={handleOpenBrowser}
          className={styles.button}
        >
          {t('share.continueHere')}
        </Button>
      </div>
    </div>
  );
};

export { ShareRedirect };
