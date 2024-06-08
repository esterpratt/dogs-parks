import { useContext, useEffect } from 'react';
import { LoginSigninContainer } from './LoginSigninContainer';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router';

const Signin = () => {
  const { user, isDogCreated } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && isDogCreated) {
      navigate(`/profile/${user.id}`);
    }
  }, [user, isDogCreated, navigate]);

  return <LoginSigninContainer method="signin" />;
};

export { Signin };
