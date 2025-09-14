import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AppError } from '../services/error';
import { NavbarBottom } from '../components/NavbarBottom';
import { TreatToss } from '../components/TreatToss';
import styles from './Error.module.scss';
import { useTransportOnline } from '../hooks/useTransportOnline';

const GENERIC_MESSAGE = 'There was a problem';

const ErrorPage: React.FC = () => {
  const error = useRouteError();
  const transport = useTransportOnline();
  const isOffline = transport !== null && transport.isConnected === false;

  let message = GENERIC_MESSAGE;

  if (isRouteErrorResponse(error)) {
    if (error.status === 503) {
      message = 'You are offline. Connect to the internet to continue.';
    } else {
      message = error.data.message;

      if (error.status === 404 && !error.data.message) {
        message = 'Could not find page';
      }
    }
  } else if (error instanceof AppError) {
    message = error.message;
  } else if (isOffline && message === GENERIC_MESSAGE) {
    message = 'You are offline. Connect to the internet to continue.';
  }

  return (
    <>
      <div className={styles.content}>
        <div className={styles.text}>
          <span>Uh-oh! {message}</span>
          <span>Toss me more treats and try again!</span>
        </div>
        <TreatToss />
      </div>
      <NavbarBottom />
    </>
  );
};

export { ErrorPage };
