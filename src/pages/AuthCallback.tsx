import { UserContext } from '../context/UserContext';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader } from '../components/Loader';

const AuthCallback = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(`/profile/${user.id}`);
    }
  }, [user, navigate]);

  return <Loader />;
};

export { AuthCallback };
