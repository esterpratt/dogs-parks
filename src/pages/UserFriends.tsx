// import { useContext, useEffect, useState } from 'react';
// import { User } from '../types/user';
// import { Dog } from '../types/dog';
// import { fetchFriends } from '../../services/users';
// import { FRIENDSHIP_STATUS, USER_ROLE } from '../../types/friendship';
// import { fetchFriendship, updateFriendship } from '../../services/friendships';
// import { UserContext } from '../../context/UserContext';

// interface UserFriendsProps {
//   user: User;
//   dogs: Dog[];
//   imagesByDog: { [dogId: string]: { primary: string; other: string[] } };
// }

const UserFriends = () => {
  // TODO: remove to context friends + reviews and use it in the tabs
  // const [friends, setFriends] = useState<User[]>([]);
  // const [pendingFriends, setPendingFriends] = useState<User[]>([]);
  // const { userLogout } = useContext(UserContext);

  // useEffect(() => {
  //   const getPendingFriends = async () => {
  //     try {
  //       const pendingFriends = await fetchFriends({
  //         userId: user.id,
  //         userRole: USER_ROLE.REQUESTEE,
  //         status: FRIENDSHIP_STATUS.PENDING,
  //       });
  //       if (pendingFriends) {
  //         setPendingFriends(pendingFriends);
  //       }
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  //   const getfriends = async () => {
  //     try {
  //       const friends = await fetchFriends({ userId: user.id });
  //       if (friends) {
  //         setFriends(friends);
  //       }
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };
  //   getfriends();
  //   getPendingFriends();
  // }, [user.id]);

  // const onApproveFriendShip = async (friendId: string) => {
  //   const friendShip = await fetchFriendship([friendId, user.id]);
  //   await updateFriendship({
  //     friendshipId: friendShip!.id,
  //     status: FRIENDSHIP_STATUS.APPROVED,
  //   });
  //   const newFriend = pendingFriends.find((friend) => friend.id === friendId);
  //   setPendingFriends((prev) =>
  //     prev.filter((friend) => friend.id !== friendId)
  //   );
  //   setFriends((prev) => [...prev, newFriend!]);
  // };

  return <div></div>;
};

export { UserFriends };
