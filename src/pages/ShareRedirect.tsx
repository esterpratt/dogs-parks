import { useParams } from 'react-router-dom';
import styles from './ShareRedirect.module.scss';
import { isIos } from '../utils/platform';
import { Button } from '../components/Button';

const ShareRedirect = () => {
  const { parkId } = useParams();
  const siteLink = `https://klavhub.com/parks/${parkId}`;
  const downloadLabel = isIos() ? 'the App Store' : 'Google Play';

  const handleOpenApp = () => {
    window.location.href = `com.klavhub://parks/${parkId}`;
  };

  const handleOpenBrowser = () => {
    window.open(siteLink, '_self');
  };

  const handleOpenStore = () => {
    const fallbackLink = isIos()
      ? import.meta.env.VITE_IOS_STORE_APP_LINK || siteLink
      : import.meta.env.VITE_ANDROID_STORE_APP_LINK || siteLink;
    window.open(fallbackLink, '_self');
  };

  return (
    <div className={styles.container}>
      <h1>Someone shared a park with you!</h1>
      <p>Wanna sniff it out in the app?</p>

      <div className={styles.buttonsContainer}>
        <Button onClick={handleOpenApp} className={styles.button}>
          Open in app
        </Button>
        <Button
          variant="secondary"
          onClick={handleOpenStore}
          className={styles.button}
        >
          Download KlavHub from {downloadLabel}
        </Button>
        <Button
          variant="secondary"
          color={styles.blue}
          onClick={handleOpenBrowser}
          className={styles.button}
        >
          Continue here
        </Button>
      </div>
    </div>
  );
};

export { ShareRedirect };
