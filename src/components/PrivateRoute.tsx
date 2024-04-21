import { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const PrivateRoute = () => {
  const { user } = useContext(UserContext);
  return user ? <Outlet context={user} /> : <Navigate to="/" />;
};

export { PrivateRoute };
