import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AppError } from '../services/error';
import { NavbarBottom } from '../components/NavbarBottom';
import { TreatToss } from '../components/TreatToss';
import styles from './Error.module.scss';
import { useTransportOnline } from '../hooks/useTransportOnline';
import { useTranslation } from 'react-i18next';

const ErrorPage: React.FC = () => {
  const { t } = useTranslation();
  const error = useRouteError();
  const transport = useTransportOnline();
  const isOffline = transport !== null && transport.isConnected === false;

  const GENERIC_MESSAGE = t('error.generic');
  let message = GENERIC_MESSAGE;

  if (isRouteErrorResponse(error)) {
    if (error.status === 503) {
      message = t('error.offline');
    } else {
      message = error.data.message;

      if (error.status === 404 && !error.data.message) {
        message = t('error.notFound');
      }
    }
  } else if (error instanceof AppError) {
    message = error.message;
  } else if (isOffline && message === GENERIC_MESSAGE) {
    message = t('error.offline');
  }

  return (
    <>
      <div className={styles.content}>
        <div className={styles.text}>
          <span>{t('error.title', { message })}</span>
          <span>{t('error.tryAgain')}</span>
        </div>
        <TreatToss />
      </div>
      <NavbarBottom />
    </>
  );
};

export { ErrorPage };
