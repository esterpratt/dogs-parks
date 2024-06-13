import { useContext, useEffect } from 'react';
import { LoginSigninContainer } from './LoginSigninContainer';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router';

const Signin = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(`/profile/${user.id}`);
    }
  }, [user, navigate]);

  return <LoginSigninContainer method="signin" />;
};

export { Signin };
