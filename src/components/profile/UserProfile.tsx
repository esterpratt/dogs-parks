import { Outlet } from 'react-router';
import { User } from '../../types/user';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import { Dog } from '../../types/dog';
import { DogsImages } from './DogsImages';
import { ProfileTabs } from './ProfileTabs';
import styles from './UserProfile.module.scss';
import { Button } from '../Button';
import { FriendRequestButton } from './FriendRequestButton';

interface UserProfileProps {
  user: User;
  dogs: Dog[];
  imagesByDog: { [dogId: string]: { primary: string; other: string[] } };
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  dogs,
  imagesByDog,
}) => {
  const { user: signedInUser, userLogout } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === user.id;
  const [currentDogId, setCurrentDogId] = useState<string>(dogs[0]?.id);

  useEffect(() => {
    setCurrentDogId(dogs[0]?.id);
  }, [dogs]);

  const primaryImages = Object.keys(imagesByDog).map((id) => {
    return {
      id,
      src: imagesByDog[id].primary,
    };
  });

  const dogsNames = dogs.map((dog) => dog.name);
  const lastDogName = dogsNames.pop();
  const dogNamesStr =
    dogs.length === 1
      ? dogs[0].name
      : `${dogsNames.join(', ')} & ${lastDogName}`;

  const onLogout = () => {
    userLogout();
  };

  return (
    <div>
      <div className={styles.imgsContainer}>
        {!!dogs.length && currentDogId && (
          <DogsImages
            images={primaryImages}
            currentDogId={currentDogId}
            setCurrentDogId={setCurrentDogId}
            isSignedInUser
          />
        )}
        <div>
          <span>
            {isSignedInUser ? 'Hello ' : 'Meet '}
            {dogs.length ? dogNamesStr : user.name}
          </span>
          {isSignedInUser && <Button onClick={onLogout}>Logout</Button>}
          {!isSignedInUser && signedInUser && (
            <FriendRequestButton
              userId={user.id}
              signedInUserId={signedInUser.id}
            />
          )}
        </div>
      </div>
      {isSignedInUser && <ProfileTabs />}
      <div className={styles.outletContainer}>
        <Outlet
          context={{
            user,
            dogs,
            imagesByDog,
            currentDogId,
            setCurrentDogId,
            isSignedInUser,
          }}
        />
      </div>
    </div>
  );
};

export { UserProfile };
export type { UserProfileProps };
