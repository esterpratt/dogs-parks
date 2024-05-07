import { useOutletContext, useRevalidator } from 'react-router';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import classnames from 'classnames';
import { Dog } from '../types/dog';
import { User } from '../types/user';
import { DogDetails } from '../components/profile/DogDetails';
import { Accordion } from '../components/Accordion/Accordion';
import { AccordionTitle } from '../components/Accordion/AccordionTitle';
import { AccordionContent } from '../components/Accordion/AccordionContent';
import { AccordionArrow } from '../components/Accordion/AccordionArrow';
import styles from './ProfileInfo.module.scss';
import { UserDetails } from '../components/profile/UserDetails';
import { DogGalleryContainer } from '../components/profile/DogGalleryContainer';
import { Button } from '../components/Button';
import { MouseEvent, useState } from 'react';
import { EditDogsModal } from '../components/profile/EditDogsModal';
import { EditUserModal } from '../components/profile/EditUserModal';

interface ProfileInfoProps {
  user: User;
  dogs: Dog[];
  currentDogId: string;
  setCurrentDogId: (id: string) => void;
  imagesByDog: { [dogId: string]: { primary: string; other: string[] } };
  isSignedInUser: boolean;
}

const ProfileInfo = () => {
  const {
    user,
    dogs,
    imagesByDog,
    currentDogId,
    setCurrentDogId,
    isSignedInUser,
  } = useOutletContext<ProfileInfoProps>();
  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const { revalidate } = useRevalidator();

  const galleryImages: { [id: string]: string[] } = {};
  Object.keys(imagesByDog).forEach((id) => {
    galleryImages[id] = imagesByDog[id].other;
  });

  const onEditDog = (event: MouseEvent<HTMLButtonElement | SVGElement>) => {
    event?.stopPropagation();
    setIsEditDogsModalOpen(true);
  };

  const onEditUser = (event: MouseEvent) => {
    event?.stopPropagation();
    setIsEditUserModalOpen(true);
  };

  const onCloseDogsModal = () => {
    setIsEditDogsModalOpen(false);
    revalidate();
  };

  return (
    <div className={styles.infoContainer}>
      <Accordion>
        <AccordionTitle className={styles.title}>
          {(isOpen) => (
            <>
              <div className={styles.left}>
                <span>Doggy Card</span>
                <AccordionArrow isOpen={isOpen} />
              </div>
              {isSignedInUser && (
                <MdOutlineModeEditOutline onClick={onEditDog} size={18} />
              )}
            </>
          )}
        </AccordionTitle>
        <AccordionContent
          className={classnames(styles.contentContainer, styles.dark)}
        >
          {!!dogs.length && (
            <DogDetails
              className={styles.content}
              dogs={dogs}
              currentDogId={currentDogId}
              setCurrentDogId={setCurrentDogId}
            />
          )}
          {!dogs.length && (
            <Button className={styles.content} onClick={onEditDog}>
              {isSignedInUser
                ? 'Add your dog'
                : `${user.name} Did not add their dog`}
            </Button>
          )}
        </AccordionContent>
      </Accordion>
      {!!dogs.length && (
        <DogGalleryContainer
          galleryImages={galleryImages}
          dogs={dogs}
          currentDogId={currentDogId}
          setCurrentDogId={setCurrentDogId}
          isSignedInUser={isSignedInUser}
          accordionTitleClassName={styles.title}
          accordionContentContainerClassName={styles.contentContainer}
          accordionContentClassName={styles.content}
        />
      )}
      <Accordion>
        <AccordionTitle className={styles.title}>
          {(isOpen) => (
            <>
              <div className={styles.left}>
                <span>Owner Card</span>
                <AccordionArrow isOpen={isOpen} />
              </div>
              {isSignedInUser && (
                <MdOutlineModeEditOutline onClick={onEditUser} size={18} />
              )}
            </>
          )}
        </AccordionTitle>
        <AccordionContent
          className={classnames(styles.contentContainer, styles.dark)}
        >
          <UserDetails user={user} className={styles.content} />
        </AccordionContent>
        <EditDogsModal
          dogs={dogs}
          isOpen={isEditDogsModalOpen}
          onClose={onCloseDogsModal}
          currentDogId={currentDogId}
        />
        <EditUserModal
          isOpen={isEditUserModalOpen}
          onClose={() => setIsEditUserModalOpen(false)}
        />
      </Accordion>
    </div>
  );
};

export { ProfileInfo };
