import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AppError } from '../services/error';
import { NavbarBottom } from '../components/NavbarBottom';
import { TreatToss } from '../components/TreatToss';
import styles from './Error.module.scss';

const ErrorPage: React.FC = () => {
  const error = useRouteError();

  let message = 'There was a problem';

  if (isRouteErrorResponse(error)) {
    message = error.data.message;

    if (error.status === 404 && !error.data.message) {
      message = 'Could not find page';
    }
  } else if (error instanceof AppError) {
    message = error.message;
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
