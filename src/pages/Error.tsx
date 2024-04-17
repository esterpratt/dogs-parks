import { isRouteErrorResponse, useRouteError } from 'react-router';

const ErrorPage: React.FC = () => {
  const error = useRouteError();

  let message = 'There was a problem';

  if (isRouteErrorResponse(error)) {
    message = error.data.message;

    if (error.status === 404 && !error.data.message) {
      message = 'Could not find page';
    }
  }

  return <div>Hav Hav! Where are my snacks?? {message}</div>;
};

export { ErrorPage };
