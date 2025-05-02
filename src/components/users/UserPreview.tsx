import { useContext, useState } from 'react';
import { Link } from 'react-router';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { Check, Dog as DogIcon, X } from 'lucide-react';
import { User } from '../../types/user';
import { Dog } from '../../types/dog';
import { fetchDogPrimaryImage } from '../../services/dogs';
import { UserContext } from '../../context/UserContext';
import { useUpdateFriendship } from '../../hooks/api/useUpdateFriendship';
import { FRIENDSHIP_STATUS } from '../../types/friendship';
import { Loader } from '../Loader';
import { Card } from '../card/Card';
import { getDogNames } from '../../utils/getDogNames';
import { useNotification } from '../../context/NotificationContext';
import { TopModal } from '../modals/TopModal';
import { Button } from '../Button';
import styles from './UserPreview.module.scss';

interface UserPreviewProps {
  user: User & { dogs: Dog[] };
  showFriendshipButton?: boolean;
}

const UserPreview: React.FC<UserPreviewProps> = ({
  user,
  showFriendshipButton,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userId } = useContext(UserContext);
  const { notify } = useNotification();

  const { data: dogImage } = useQuery({
    queryKey: ['dogImage', user.dogs[0].id],
    queryFn: async () => {
      const image = await fetchDogPrimaryImage(user.dogs[0].id);
      return image || null;
    },
  });

  const {
    onUpdateFriendship,
    isPendingMutateFriendship,
    isPendingRemoveFriendship,
  } = useUpdateFriendship({
    friendId: user.id,
    userId: userId!,
    onSuccess: (text) => {
      notify(text);
    },
  });

  const dogNames = getDogNames(user.dogs);

  return (
    <>
      <Card
        onClick={() => setIsModalOpen(true)}
        url={userId ? `/profile/${user.id}` : null}
        imgCmp={
          <div className={classnames(styles.img, !dogImage && styles.noImg)}>
            {dogImage ? (
              <img src={dogImage} />
            ) : (
              <DogIcon size={64} color={styles.green} strokeWidth={1} />
            )}
          </div>
        }
        detailsCmp={
          <div className={styles.detailsContainer}>
            <span className={styles.dogNames}>{dogNames}</span>
            <span className={styles.userNameContainer}>
              <span className={styles.userName}>{user.name}'s</span>
              <span> dog{user.dogs.length > 1 ? 's' : ''}</span>
            </span>
          </div>
        }
        buttons={
          showFriendshipButton
            ? [
                {
                  children: (
                    <>
                      {isPendingMutateFriendship ? (
                        <Loader
                          variant="secondary"
                          className={styles.loader}
                          inside
                        />
                      ) : (
                        <>
                          <Check size={12} />
                          <span>Accept</span>
                        </>
                      )}
                    </>
                  ),
                  onClick: () => onUpdateFriendship(FRIENDSHIP_STATUS.APPROVED),
                },
                {
                  children: (
                    <>
                      {isPendingRemoveFriendship ? (
                        <Loader className={styles.loader} inside />
                      ) : (
                        <>
                          <X size={12} />
                          <span>Decline</span>
                        </>
                      )}
                    </>
                  ),
                  variant: 'secondary',
                  onClick: () => onUpdateFriendship(FRIENDSHIP_STATUS.ABORTED),
                },
              ]
            : []
        }
      />
      <TopModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className={styles.modal}
      >
        <div className={styles.container}>
          <div className={styles.message}>
            <>
              To see user's page and make friends, you must{' '}
              <Link to="../login?mode=login" className={styles.link}>
                log in!
              </Link>
            </>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsModalOpen(false)}
            className={styles.modalButton}
          >
            <X size={16} />
            <span>Exit</span>
          </Button>
        </div>
      </TopModal>
    </>
  );
};

export { UserPreview };
