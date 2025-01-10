import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { PiDog } from 'react-icons/pi';
import classnames from 'classnames';
import { User } from '../../types/user';
import { Dog } from '../../types/dog';
import styles from './UserPreview.module.scss';
import { fetchDogPrimaryImage } from '../../services/dogs';
import { UserContext } from '../../context/UserContext';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../Modal';

interface UserPreviewProps {
  user: User & { dogs: Dog[] };
  showFriendshipButton?: boolean;
}

const UserPreview: React.FC<UserPreviewProps> = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userId } = useContext(UserContext);
  const { data: dogImage } = useQuery({
    queryKey: ['dogImage', user.dogs[0].id],
    queryFn: async () => {
      const images = await fetchDogPrimaryImage(user.dogs[0].id);
      if (images?.length) {
        return images[0];
      }
      return null;
    },
  });

  let dogNames = user.dogs[0].name;
  if (user.dogs.length > 1) {
    const names = user.dogs.map((dog) => dog.name);
    names.pop();
    const strNames = names.join(', ');
    dogNames = `${strNames} & ${user.dogs[user.dogs.length - 1].name}`;
  }

  const ComponentToRender = userId ? Link : 'div';

  return (
    <>
      <ComponentToRender
        onClick={() => !userId && setIsModalOpen(true)}
        to={userId ? `/profile/${user.id}` : ''}
        className={classnames(styles.cardContainer)}
      >
        <div className={classnames(styles.dogImage, !dogImage && styles.empty)}>
          {dogImage ? <img src={dogImage} /> : <PiDog size={64} />}
        </div>
        <div className={styles.details}>
          <span className={styles.dogNames}>{dogNames}</span>
          <span className={styles.userName}>Owner: {user.name}</span>
        </div>
      </ComponentToRender>
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        height="30%"
        className={styles.modal}
        variant="center"
      >
        <div className={styles.message}>
          <>
            To see user's page and make friends, you must{' '}
            <Link to="../login" className={styles.link}>
              log in
            </Link>
          </>
        </div>
      </Modal>
    </>
  );
};

export { UserPreview };
