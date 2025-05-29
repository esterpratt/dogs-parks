import { useParams } from 'react-router-dom';
import styles from './ShareRedirect.module.scss';
import { isIos } from '../utils/platform';

const ShareRedirect = () => {
  const { parkId } = useParams();
  const siteLink = `https://klavhub.com/parks/${parkId}`;

  const handleOpenApp = () => {
    window.location.href = `com.klavhub://parks/${parkId}`;

    setTimeout(() => {
      const fallbackLink = isIos()
        ? import.meta.env.VITE_IOS_STORE_APP_LINK || siteLink
        : import.meta.env.VITE_ANDROID_STORE_APP_LINK || siteLink;

      window.open(fallbackLink, '_self');
    }, 1500);
  };

  const handleOpenBrowser = () => {
    window.open(siteLink, '_self');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Someone shared a dog-park with you!</h1>
      <p className={styles.subtitle}>Wanna sniff it out in the app?</p>

      <div className={styles.buttonsContainer}>
        <button onClick={handleOpenApp} className={styles.appButton}>
          Open in App
        </button>
        <button onClick={handleOpenBrowser} className={styles.browserButton}>
          Continue here
        </button>
      </div>

      <p className={styles.note}>
        P.S. If the app doesn't open, we'll fetch the bone from the store
      </p>
    </div>
  );
};

export { ShareRedirect };
