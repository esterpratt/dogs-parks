import { useOutletContext } from 'react-router';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa6';
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
      <Accordion>
        <AccordionTitle className={styles.title}>
          {(isOpen) => (
            <>
              <div className={styles.left}>
                <span>Gallery</span>
                <AccordionArrow isOpen={isOpen} />
              </div>
              <FaPlus size={14} />
            </>
          )}
        </AccordionTitle>
        <AccordionContent className={styles.contentContainer}>
          <div className={styles.content}>{JSON.stringify(imagesByDog)}</div>
        </AccordionContent>
      </Accordion>
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
