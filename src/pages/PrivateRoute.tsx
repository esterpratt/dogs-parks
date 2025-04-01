import { PropsWithChildren, useContext } from 'react';
import { Navigate } from 'react-router';
import { UserContext } from '../context/UserContext';
import { Loader } from '../components/Loader';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

const PrivateRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoadingAuthUser } = useContext(UserContext);
  const showLoader = useDelayedLoading({ isLoading: isLoadingAuthUser });

  if (showLoader) {
    return <Loader />;
  }

  if (user?.id) {
    return children;
  }

  if (localStorage.getItem('userDeleted')) {
    return <Navigate to="/user-deleted" state={{ userDeleted: true }} />;
  }

  return <Navigate to="/" />;
};

export { PrivateRoute };
