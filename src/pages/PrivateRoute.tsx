import { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const PrivateRoute = () => {
  const { userId, loadingUserId } = useContext(UserContext);

  if (loadingUserId) {
    return <div>Loading...</div>;
  }

  return userId ? <Outlet /> : <Navigate to="/" />;
};

export { PrivateRoute };
