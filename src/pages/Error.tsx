import { isRouteErrorResponse, useRouteError } from 'react-router';
import { AppError } from '../services/error';
import { NavbarTop } from '../components/NavbarTop';
import { NavbarBottom } from '../components/NavbarBottom';
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
      <NavbarTop />
      <div className={styles.content}>
        <span>Oops! {message}</span>
        <span>Try to give me more snacks!</span>
      </div>
      <NavbarBottom />
    </>
  );
};

export { ErrorPage };
