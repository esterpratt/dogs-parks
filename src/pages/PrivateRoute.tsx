import { PropsWithChildren, useContext } from 'react';
import { Navigate, useLoaderData } from 'react-router';
import { UserContext } from '../context/UserContext';
import { Loader } from '../components/Loader';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { Friendship } from '../types/friendship';

const PrivateRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, pendingFriendships, approvedFriendships } = useLoaderData();
  const { userId, isLoadingAuthUser } = useContext(UserContext);
  const showLoader = useDelayedLoading({ isLoading: isLoadingAuthUser });

  if (showLoader) {
    return <Loader />;
  }

  if (localStorage.getItem('userDeleted')) {
    return <Navigate to="/user-deleted" state={{ userDeleted: true }} />;
  }

  if (userId && (userId === user.id || !user.private)) {
    return children;
  }

  const pendingFriendsIds = pendingFriendships.map((friendship: Friendship) => {
    if (user.id === friendship.requesteeId) {
      return friendship.requesterId;
    }
    return friendship.requesteeId;
  });

  const approvedFriendsIds = approvedFriendships.map(
    (friendship: Friendship) => {
      if (user.id === friendship.requesteeId) {
        return friendship.requesterId;
      }
      return friendship.requesteeId;
    }
  );

  if (userId && pendingFriendsIds.concat(approvedFriendsIds).includes(userId)) {
    return children;
  }

  return <Navigate to="/" />;
};

export { PrivateRoute };
