import { useOutletContext } from 'react-router';
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

interface ProfileInfoProps {
  user: User;
  dogs: Dog[];
  currentDogId: string;
  setCurrentDogId: (id: string) => void;
  imagesByDog: { [dogId: string]: { primary: string; other: string[] } };
}

const ProfileInfo = () => {
  const { user, dogs, imagesByDog, currentDogId, setCurrentDogId } =
    useOutletContext<ProfileInfoProps>();

  const galleryImages: { [id: string]: string[] } = {};
  Object.keys(imagesByDog).forEach((id) => {
    galleryImages[id] = imagesByDog[id].other;
  });

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
              <MdOutlineModeEditOutline size={18} />
            </>
          )}
        </AccordionTitle>
        <AccordionContent
          className={classnames(styles.contentContainer, styles.dark)}
        >
          <DogDetails
            className={styles.content}
            dogs={dogs}
            currentDogId={currentDogId}
            setCurrentDogId={setCurrentDogId}
          />
        </AccordionContent>
      </Accordion>
      <DogGalleryContainer
        galleryImages={galleryImages}
        dogs={dogs}
        currentDogId={currentDogId}
        setCurrentDogId={setCurrentDogId}
        accordionTitleClassName={styles.title}
        accordionContentContainerClassName={styles.contentContainer}
        accordionContentClassName={styles.content}
      />
      <Accordion>
        <AccordionTitle className={styles.title}>
          {(isOpen) => (
            <>
              <div className={styles.left}>
                <span>Owner Card</span>
                <AccordionArrow isOpen={isOpen} />
              </div>
              <MdOutlineModeEditOutline size={18} />
            </>
          )}
        </AccordionTitle>
        <AccordionContent
          className={classnames(styles.contentContainer, styles.dark)}
        >
          <UserDetails user={user} className={styles.content} />
        </AccordionContent>
      </Accordion>
    </div>
  );
};

export { ProfileInfo };
