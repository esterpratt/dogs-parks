import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { User } from '../../types/user';
import { Dog, GENDER } from '../../types/dog';
import { fetchDogPrimaryImage } from '../../services/dogs';
import { UserContext } from '../../context/UserContext';
import { useUpdateFriendship } from '../../hooks/api/useUpdateFriendship';
import { FRIENDSHIP_STATUS } from '../../types/friendship';
import { Card } from '../card/Card';
import { getDogNames } from '../../utils/getDogNames';
import { TopModal } from '../modals/TopModal';
import { Button } from '../Button';
import { Image } from '../Image';
import DogIcon from '../../assets/dog.svg?react';
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
  const { t } = useTranslation();

  const { data: dogImage } = useQuery({
    queryKey: ['dogImage', user.dogs[0]?.id ?? null],
    queryFn: async () => fetchDogPrimaryImage(user.dogs[0].id),
    enabled: user.dogs.length > 0,
  });

  const { onUpdateFriendship } = useUpdateFriendship({
    friendId: user.id,
    userId: userId!,
  });

  const dogNames = user.dogs.length ? getDogNames(user.dogs) : null;

  return (
    <>
      <Card
        onClick={() => setIsModalOpen(true)}
        url={userId ? `/profile/${user.id}` : null}
        imgCmp={
          <>
            {dogImage ? (
              <div className={styles.imgContainer}>
                <Image src={dogImage} className={styles.img} />
              </div>
            ) : (
              <div className={classnames(styles.img, styles.noImg)}>
                <DogIcon width={64} height={64} />
              </div>
            )}
          </>
        }
        detailsCmp={
          <div className={styles.detailsContainer}>
            {dogNames ? (
              <>
                <span className={styles.dogNames}>{dogNames}</span>
                <span className={styles.userNameContainer}>
                  <span className={styles.userName}>{user.name}</span>
                  <span>
                    {' '}
                    {t('users.preview.dogsCount', {
                      count: user.dogs.length,
                      context:
                        user.dogs.length === 1 &&
                        user.dogs[0]?.gender === GENDER.FEMALE
                          ? 'female'
                          : undefined,
                    })}
                  </span>
                </span>
              </>
            ) : (
              <span className={styles.userNameContainer}>
                <span className={styles.userName}>{user.name}</span>
              </span>
            )}
          </div>
        }
        buttons={
          showFriendshipButton
            ? [
                {
                  children: (
                    <>
                      <Check size={12} />
                      <span>{t('users.preview.accept')}</span>
                    </>
                  ),
                  onClick: () => onUpdateFriendship(FRIENDSHIP_STATUS.APPROVED),
                },
                {
                  children: (
                    <>
                      <X size={12} />
                      <span>{t('users.preview.decline')}</span>
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
              {t('users.preview.gated.prefix')}{' '}
              <Link to="../login?mode=login" className={styles.link}>
                {t('users.preview.gated.login')}
              </Link>
            </>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsModalOpen(false)}
            className={styles.modalButton}
          >
            <X size={16} />
            <span>{t('users.preview.exit')}</span>
          </Button>
        </div>
      </TopModal>
    </>
  );
};

export { UserPreview };
