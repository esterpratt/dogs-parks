import { useContext, useEffect } from 'react';
import { LoginSigninContainer } from './LoginSigninContainer';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router';

const Login = () => {
  const { userId } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  }, [userId, navigate]);

  return <LoginSigninContainer method="login" />;
};

export { Login };
