import { useContext, useState } from 'react';
import { Link, Outlet, useMatch, useParams } from 'react-router-dom';
import { Cake, Mars, MoveLeft, Pencil, Tag, Venus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { GENDER } from '../types/dog';
import {
  DOG_IMAGE_QUERY_REFRESH_MS,
  fetchDogPrimaryImage,
  fetchDogPage,
} from '../services/dogs';
import { getLocalizedDogAgeText } from '../utils/dogAge';
import { capitalizeText } from '../utils/text';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import DogIcon from '../assets/dog.svg?react';
import { DogDetails } from '../components/dog/DogDetails';
import { DogGalleryContainer } from '../components/dog/DogGalleryContainer';
import { Loader } from '../components/Loader';
import { EnlargeImageModal } from '../components/EnlargeImageModal';
import { Button } from '../components/Button';
import { DogPreferences } from '../components/dog/DogPreferences';
import { TabsList } from '../components/tabs/TabsList';
import { Header } from '../components/Header';
import { HeaderImage } from '../components/HeaderImage';
import { PrevLinks } from '../components/PrevLinks';
import { EditDogModal } from '../components/dog/EditDogModal';
import { UserContext } from '../context/UserContext';

import styles from './UserDog.module.scss';

const UserDog = () => {
  const { dogId } = useParams();
  const ownershipRoute = useMatch('/dogs/:dogId/ownership/*');
  const requestRoute = useMatch('/dogs/:dogId/ownership/request');
  const showOwnership = !!ownershipRoute && !requestRoute;
  const { userId } = useContext(UserContext);
  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);
  const { t } = useTranslation();

  const { data: dogPage, isLoading: isLoadingDog } = useQuery({
    queryKey: ['dogPage', dogId],
    queryFn: () => fetchDogPage(dogId!),
    throwOnError: true,
  });
  const dog = dogPage?.dog;
  const userName = dogPage?.profile_user.name ?? '';

  const { data: primaryImage } = useQuery({
    queryKey: ['dogImage', dogId],
    queryFn: async () => fetchDogPrimaryImage(dogId!),
    refetchInterval: DOG_IMAGE_QUERY_REFRESH_MS,
    staleTime: DOG_IMAGE_QUERY_REFRESH_MS,
  });

  const { showLoader } = useDelayedLoading({
    isLoading: isLoadingDog,
    minDuration: 750,
  });

  const onCloseDogsModal = () => {
    setIsEditDogsModalOpen(false);
  };

  const onEditDog = (scrollToInput?: boolean) => {
    setIsEditDogsModalOpen(true);
    if (scrollToInput) {
      sessionStorage.setItem('scroll-to-element', 'true');
    }
  };

  const onClickImage = (img: string) => {
    setImageToEnlarge(img);
    setIsEnlargeImageModalOpen(true);
  };

  if (showLoader) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }

  if (!dogPage || !dog) {
    return (
      <main className={styles.container}>
        <p>{t('dogOwnership.outcomes.DOG_UNAVAILABLE')}</p>
      </main>
    );
  }

  // The server derives ownership for direct URLs and refreshes; router state
  // is presentation context only and is never an authorization input.
  const isSignedInUser = dogPage.viewer.is_owner;
  const canEdit = dogPage.viewer.can_edit;
  const ownershipCapabilities = dogPage.capabilities;

  const ageText = getLocalizedDogAgeText({
    birthday: dog.birthday,
    gender: dog.gender,
    t,
  });

  return (
    <>
      <div className={styles.container}>
        <Header
          prevLinksCmp={
            <PrevLinks
              links={{
                to: `/profile/${isSignedInUser ? userId : dogPage.profile_user.id}/dogs`,
                icon: <MoveLeft size={16} />,
                text: isSignedInUser ? (
                  t('userDogs.titleMyPack')
                ) : (
                  <Trans
                    i18nKey="userDogs.titleUsersPack"
                    values={{ name: userName }}
                    components={{
                      name: <span className={styles.name} />,
                    }}
                  />
                ),
              }}
            />
          }
          imgCmp={
            <HeaderImage
              imgSrc={primaryImage}
              onClickImg={onClickImage}
              NoImgIcon={DogIcon}
              onClickEditPhoto={null}
            />
          }
          bottomCmp={
            <>
              <div className={styles.details}>
                <div className={styles.topPart}>
                  <div className={styles.dogDetails}>
                    <span className={styles.name}>{dog.name}</span>
                    {dog.gender && (
                      <span className={styles.gender}>
                        {dog.gender === GENDER.FEMALE ? (
                          <Venus color={styles.green} size={18} />
                        ) : (
                          <Mars color={styles.green} size={18} />
                        )}
                      </span>
                    )}
                  </div>
                  {!isSignedInUser && (
                    <span className={styles.userName}>
                      {dog.gender === GENDER.FEMALE
                        ? t('dogs.labels.ownersDogFemale', {
                            name: capitalizeText(userName),
                          })
                        : t('dogs.labels.ownersDogMale', {
                            name: capitalizeText(userName),
                          })}
                    </span>
                  )}
                </div>
                <div className={styles.bottomPart}>
                  {ageText && (
                    <span className={styles.age}>
                      <Cake color={styles.green} size={14} />
                      <span>{ageText}</span>
                    </span>
                  )}
                  {dog.breed && (
                    <span className={styles.breed}>
                      <Tag color={styles.green} size={14} />
                      <span>
                        {t(`dogs.breeds.${dog.breed}`, {
                          defaultValue: dog.breed,
                        })}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              {canEdit && (
                <Button
                  variant="secondary"
                  onClick={() => onEditDog()}
                  className={styles.editButton}
                >
                  <Pencil size={18} />
                </Button>
              )}
            </>
          }
          bottomClassName={classnames(styles.bottom, {
            [styles.center]: !isSignedInUser,
          })}
        />
        {isSignedInUser ? (
          <TabsList
            tabs={[
              { text: t('dogOwnership.detailsTab'), url: `/dogs/${dog.id}` },
              {
                text: t('dogOwnership.manageTitle'),
                url: `/dogs/${dog.id}/ownership`,
                end: false,
              },
            ]}
          />
        ) : null}
        <div className={styles.content}>
          {showOwnership ? (
            <Outlet />
          ) : (
            <>
              <DogDetails
                isSignedInUser={canEdit}
                dog={dog}
                userName={userName}
                onEditDog={() => onEditDog()}
              />
              <DogPreferences
                dog={dog}
                isSignedInUser={canEdit}
                userName={userName}
                onEditDog={() => onEditDog(true)}
              />
              <DogGalleryContainer dog={dog} isSignedInUser={isSignedInUser} />
              {/* Infrequent ownership requests sit after the everyday dog content. */}
              {ownershipCapabilities?.enabled &&
              !isSignedInUser &&
              (ownershipCapabilities.can_request ||
                ownershipCapabilities.pending_action) ? (
                <Link
                  className={styles.ownershipAction}
                  to={`/dogs/${dog.id}/ownership/request`}
                >
                  {t('dogOwnership.requestAction')}
                </Link>
              ) : null}
              <Outlet />
            </>
          )}
        </div>
      </div>
      <EnlargeImageModal
        isOpen={isEnlargedImageModalOpen}
        onClose={() => setIsEnlargeImageModalOpen(false)}
        imgSrc={imageToEnlarge}
        setImgSrc={setImageToEnlarge}
      />
      <EditDogModal
        dog={dog}
        isOpen={canEdit && isEditDogsModalOpen}
        onClose={onCloseDogsModal}
      />
    </>
  );
};

export default UserDog;
