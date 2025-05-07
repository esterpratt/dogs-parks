import { PropsWithChildren, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const PrivateRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const { userId, isLoadingAuthUser } = useContext(UserContext);

  if (userId) {
    return children;
  }

  if (localStorage.getItem('userDeleted')) {
    return <Navigate to="/user-deleted" state={{ userDeleted: true }} />;
  }

  if (!isLoadingAuthUser && !userId) {
    return <Navigate to="/" />;
  }

  return children;
};

export { PrivateRoute };
