import { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { Loading } from '../components/Loading';

const PrivateRoute = () => {
  const { userId, loadingUserId } = useContext(UserContext);

  if (loadingUserId) {
    return <Loading />;
  }

  return userId ? <Outlet /> : <Navigate to="/" />;
};

export { PrivateRoute };
