import { ErrorResponse, useRouteError } from 'react-router';

const ErrorPage: React.FC = () => {
  const error = useRouteError() as ErrorResponse;

  let message = error.data;
  if (error.status === 404) {
    message = 'Could not find page';
  }

  return <div>Hav Hav! Where are my snacks?? {message}</div>;
};

export { ErrorPage };
