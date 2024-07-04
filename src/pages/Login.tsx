import { useContext, useEffect, useState } from 'react';
import { LoginSigninContainer } from './LoginSigninContainer';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router';
import { Loader } from '../components/Loading';

const Login = () => {
  const { userId, isLoading } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      navigate(`/profile/${userId}`);
    } else {
      if (!isLoading) {
        setLoading(false);
      }
    }
  }, [userId, navigate, isLoading, setLoading]);

  if (loading) {
    return <Loader />;
  }

  return <LoginSigninContainer method="login" />;
};

export { Login };
