// import { useContext, useEffect, useState } from 'react';
import { User } from '../../types/user';
// import { fetchFriends } from '../../services/users';
// import { FRIENDSHIP_STATUS, USER_ROLE } from '../../types/friendship';
// import { fetchFriendship, updateFriendship } from '../../services/friendships';
// import { UserContext } from '../../context/UserContext';
import { Dog } from '../../types/dog';
import { DogsImages } from './DogsImages';
import styles from './PrivateProfile.module.scss';
import { Outlet } from 'react-router';
import { ProfileTabs } from './ProfileTabs';

interface PrivateProfileProps {
  user: User;
  dogs: Dog[];
  imagesByDog: { [dogId: string]: { primary: string; other: string[] } };
}

const PrivateProfile: React.FC<PrivateProfileProps> = ({
  user,
  dogs,
  imagesByDog,
}) => {
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

  const primaryDogsImages = Object.values(imagesByDog).map(
    (dogImages) => dogImages.primary
  );
  const dogsNames = dogs.map((dog) => dog.name);
  const lastDogName = dogsNames.pop();
  const dogNamesStr = `${dogsNames.join(', ')} & ${lastDogName}`;

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

  return (
    <div>
      <div className={styles.imgsContainer}>
        <DogsImages images={primaryDogsImages} />
        <span>{dogNamesStr}</span>
      </div>
      <ProfileTabs />
      <div className={styles.outletContainer}>
        <Outlet context={{ user, dogs, imagesByDog }} />
      </div>
      {/* {!!friends.length && <FriendsList friends={friends} />}
      {!!pendingFriends.length && (
        <FriendRequestsList
          friends={pendingFriends}
          onApproveFriendShip={onApproveFriendShip}
        />
      )} */}
    </div>
  );
};

export { PrivateProfile };
