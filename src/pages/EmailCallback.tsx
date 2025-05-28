import { UserContext } from '../context/UserContext';
import { useContext } from 'react';
import { Loader } from '../components/Loader';
import styles from './EmailCallback.module.scss';
import { Link } from 'react-router';
import { Button } from '../components/Button';

const EmailCallback = () => {
  const { user } = useContext(UserContext);

  if (user) {
    return (
      <div className={styles.container}>
        <h1>Good boy!</h1>
        <p>Your account is verified and you're officially part of the pack.</p>
        <p>
          You can close this tab and fetch the app to continue your adventure.
        </p>
        <div className={styles.buttonsContainer}>
          <Button>
            <a href="com.klavhub://login" className={styles.appLink}>
              Open the app
            </a>
          </Button>
          <Button variant="secondary">
            <Link to={`/profile/${user.id}`} className={styles.link}>
              Continue here
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
