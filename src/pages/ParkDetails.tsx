import { useContext, useState } from 'react';
import { useOutletContext } from 'react-router';
import { IconContext } from 'react-icons';
import { Accordion } from '../components/Accordion/Accordion';
import { AccordionContent } from '../components/Accordion/AccordionContent';
import { AccordionTitle } from '../components/Accordion/AccordionTitle';
import { BusyHours } from '../components/park/BusyHours';
import { Park } from '../types/park';
import { ParkGenerals } from '../components/park/ParkGenerals';
import { AccordionArrow } from '../components/Accordion/AccordionArrow';
import { ParkGalleryContainer } from '../components/park/ParkGalleryContainer';
import { UserContext } from '../context/UserContext';
import styles from './ParkDetails.module.scss';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { EditParkModal } from '../components/park/EditParkModal';

const ParkDetails = () => {
  const park = useOutletContext<Park>();
  const { userId } = useContext(UserContext);
  const isEditable =
    userId && (!park.size || park.materials || park.hasShade || park.hasWater);
  const [isEditParkModalOpen, setIsEditParkModalOpen] = useState(false);

  return (
    <div>
      <Accordion>
        <AccordionTitle>
          {(isOpen) => (
            <>
              <div className={styles.left}>
                <span>More about this park</span>
                <AccordionArrow isOpen={isOpen} />
              </div>
              {isEditable && (
                <IconContext.Provider value={{ className: styles.editIcon }}>
                  <MdOutlineModeEditOutline
                    onClick={() => setIsEditParkModalOpen(true)}
                    size={18}
                  />
                </IconContext.Provider>
              )}
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
      {isEditable && (
        <EditParkModal
          park={park}
          isOpen={isEditParkModalOpen}
          onClose={() => setIsEditParkModalOpen(false)}
        />
      )}
      <ParkGalleryContainer parkId={park.id} />
    </div>
  );
};

export { ParkDetails };
