import { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { Loader } from '../components/Loading';

const PrivateRoute = () => {
  const { userId, isLoadingAuthUser } = useContext(UserContext);

  if (isLoadingAuthUser) {
    return <Loader />;
  }

  return userId ? <Outlet /> : <Navigate to="/" />;
};

export { PrivateRoute };
