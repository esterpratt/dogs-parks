import { useContext, useEffect } from 'react';
import { LoginSigninContainer } from './LoginSigninContainer';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router';
import { Loader } from '../components/Loading';

const Login = () => {
  const { userId, isLoading } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  }, [userId, navigate]);

  if (isLoading) {
    return <Loader />;
  }

  return <LoginSigninContainer method="login" />;
};

export { Login };
