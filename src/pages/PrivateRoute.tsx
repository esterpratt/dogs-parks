import { PropsWithChildren, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { Loader } from '../components/Loading';

const PrivateRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const { userId, isLoadingAuthUser } = useContext(UserContext);

  if (isLoadingAuthUser) {
    return <Loader />;
  }

  if (userId) {
    return children;
  }

  if (localStorage.getItem('userDeleted')) {
    return <Navigate to="/user-deleted" state={{ userDeleted: true }} />;
  }

  return <Navigate to="/" />;
};

export { PrivateRoute };
