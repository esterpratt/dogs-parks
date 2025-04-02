import { PropsWithChildren, useContext } from 'react';
import { Navigate } from 'react-router';
import { UserContext } from '../context/UserContext';
import { Loader } from '../components/Loader';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

const PrivateRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const { userId, isLoadingAuthUser } = useContext(UserContext);
  const showLoader = useDelayedLoading({
    isLoading: isLoadingAuthUser,
    minDuration: 200,
    threshold: 0,
  });

  if (showLoader) {
    return <Loader />;
  }

  if (userId) {
    return children;
  }

  if (localStorage.getItem('userDeleted')) {
    return <Navigate to="/user-deleted" state={{ userDeleted: true }} />;
  }

  if (!isLoadingAuthUser) {
    return <Navigate to="/" />;
  }

  return children;
};

export { PrivateRoute };
