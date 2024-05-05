import { useOutletContext } from 'react-router';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa6';
import { Dog } from '../types/dog';
import { User } from '../types/user';
import { DogDetails } from '../components/profile/DogDetails';
import { Accordion } from '../components/Accordion/Accordion';
import { AccordionTitle } from '../components/Accordion/AccordionTitle';
import { AccordionContent } from '../components/Accordion/AccordionContent';
import { AccordionArrow } from '../components/Accordion/AccordionArrow';
import styles from './ProfileInfo.module.scss';

interface ProfileInfoProps {
  user: User;
  dogs: Dog[];
  imagesByDog: { [dogId: string]: { primary: string; other: string[] } };
}

const ProfileInfo = () => {
  const { user, dogs, imagesByDog } = useOutletContext<ProfileInfoProps>();
  return (
    <div>
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
        <AccordionContent>
          <DogDetails dogs={dogs} />
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
        <AccordionContent>{JSON.stringify(imagesByDog)}</AccordionContent>
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
        <AccordionContent>{user.name}</AccordionContent>
      </Accordion>
    </div>
  );
};

export { ProfileInfo };
