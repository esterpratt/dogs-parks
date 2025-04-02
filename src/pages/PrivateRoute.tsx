import { PropsWithChildren, useContext } from 'react';
import { Navigate } from 'react-router';
import { UserContext } from '../context/UserContext';
import { Loader } from '../components/Loader';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

const PrivateRoute: React.FC<PropsWithChildren> = ({ children }) => {
  // const [isLoading, setIsLoading] = useState(true);
  const { userId, isLoadingAuthUser } = useContext(UserContext);
  const showLoader = useDelayedLoading({ isLoading: isLoadingAuthUser });

  // useEffect(() => {
  //   setIsLoading(isLoadingAuthUser);
  // }, [isLoadingAuthUser]);

  console.log(
    'wtf? userId is: ',
    userId,
    'isLoadingAuthUser: ',
    isLoadingAuthUser
  );

  if (isLoadingAuthUser || showLoader) {
    return <Loader />;
  }

  if (userId) {
    return children;
  }

  if (localStorage.getItem('userDeleted')) {
    return <Navigate to="/user-deleted" state={{ userDeleted: true }} />;
  }

  return <Navigate to="/" />;
};

export { PrivateRoute };
