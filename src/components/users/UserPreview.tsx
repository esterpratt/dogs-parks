import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { User } from '../../types/user';
import { Dog } from '../../types/dog';
import {
  DOG_IMAGE_QUERY_REFRESH_MS,
  fetchDogPrimaryImage,
} from '../../services/dogs';
import { UserContext } from '../../context/UserContext';
import { useUpdateFriendship } from '../../hooks/api/useUpdateFriendship';
import { FRIENDSHIP_STATUS } from '../../types/friendship';
import { Card } from '../card/Card';
import { capitalizeText } from '../../utils/text';
import { getDogNames } from '../../utils/getDogNames';
import { TopModal } from '../modals/TopModal';
import { Button } from '../Button';
import { Image } from '../Image';
import { isRTL } from '../../utils/language';
import DogIcon from '../../assets/dog.svg?react';
import styles from './UserPreview.module.scss';

interface UserPreviewProps {
  user: User & { dogs: Dog[] };
  showFriendshipButton?: boolean;
}

const UserPreview: React.FC<UserPreviewProps> = (props) => {
  const { user, showFriendshipButton } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userId } = useContext(UserContext);
  const { t, i18n } = useTranslation();

  const { data: dogImage } = useQuery({
    queryKey: ['dogImage', user.dogs[0]?.id ?? null],
    queryFn: async () => fetchDogPrimaryImage(user.dogs[0].id),
    enabled: user.dogs.length > 0,
    refetchInterval: DOG_IMAGE_QUERY_REFRESH_MS,
    staleTime: DOG_IMAGE_QUERY_REFRESH_MS,
  });

  const { onUpdateFriendship } = useUpdateFriendship({
    friendId: user.id,
    userId: userId!,
  });

  const isRTLMode = isRTL(i18n.language);
  // Match profile name separators while preserving each mixed-script name's direction.
  const dogNames = user.dogs.length
    ? getDogNames(
        user.dogs.map((dog) => ({
          ...dog,
          name: `\u2068${capitalizeText(dog.name)}\u2069`,
        })),
      )
    : '';

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
          <div
            className={styles.detailsContainer}
            dir={isRTLMode ? 'rtl' : 'ltr'}
          >
            {/* Keep the person first, with their dogs as secondary context. */}
            <span className={styles.userName}>
              <bdi>{user.name}</bdi>
            </span>
            {user.dogs.length > 0 && (
              <span className={styles.dogNames}>
                {t('users.preview.humanOf', { dogNames })}
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
