import { useOutletContext } from 'react-router';
import { FaPlus } from 'react-icons/fa';
import { Accordion } from '../components/Accordion/Accordion';
import { AccordionContent } from '../components/Accordion/AccordionContent';
import { AccordionTitle } from '../components/Accordion/AccordionTitle';
import { BusyHours } from '../components/park/BusyHours';
import { ParkGallery } from '../components/park/ParkGallery';
import { Park } from '../types/park';
import { ParkGenerals } from '../components/park/ParkGenerals';
import { AccordionArrow } from '../components/Accordion/AccordionArrow';
import styles from './ParkDetails.module.scss';

const ParkDetails = () => {
  const park = useOutletContext<Park>();

  return (
    <div>
      <Accordion>
        <AccordionTitle>
          {(isOpen) => (
            <>
              More about this park
              <AccordionArrow isOpen={isOpen} />
            </>
          )}
        </AccordionTitle>
        <AccordionContent>
          <ParkGenerals
            size={park.size}
            ground={park.materials}
            shade={park.hasShade}
            water={park.hasWater}
          />
        </AccordionContent>
      </Accordion>
      <Accordion>
        <AccordionTitle>
          {(isOpen) => (
            <>
              Busy hours
              <AccordionArrow isOpen={isOpen} />
            </>
          )}
        </AccordionTitle>
        <AccordionContent>
          <BusyHours parkId={park.id} />
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
        <AccordionContent>
          <ParkGallery parkId={park.id} />
        </AccordionContent>
      </Accordion>
    </div>
  );
};

export { ParkDetails };
