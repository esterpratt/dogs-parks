import { useContext, useEffect } from 'react';
import { LoginSigninContainer } from './LoginSigninContainer';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router';

const Signin = () => {
  const { userId } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  }, [userId, navigate]);

  return <LoginSigninContainer method="signin" />;
};

export { Signin };
