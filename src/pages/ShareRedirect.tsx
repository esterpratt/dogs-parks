import { useParams } from 'react-router-dom';
import styles from './ShareRedirect.module.scss';
import { isIos } from '../utils/platform';
import { Button } from '../components/Button';

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
      <h1>Someone shared a park with you!</h1>
      <p>Wanna sniff it out in the app?</p>
      <p>(If the app doesn't open, we'll fetch the bone from the store)</p>

      <div className={styles.buttonsContainer}>
        <Button onClick={handleOpenApp} className={styles.button}>
          Open in app
        </Button>
        <Button
          variant="secondary"
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
