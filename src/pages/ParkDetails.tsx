import { useOutletContext } from 'react-router';
import { Accordion } from '../components/Accordion/Accordion';
import { AccordionContent } from '../components/Accordion/AccordionContent';
import { AccordionTitle } from '../components/Accordion/AccordionTitle';
import { BusyHours } from '../components/park/BusyHours';
import { Park } from '../types/park';
import { ParkGenerals } from '../components/park/ParkGenerals';
import { AccordionArrow } from '../components/Accordion/AccordionArrow';
import { ParkGalleryContainer } from '../components/park/ParkGalleryContainer';

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
      <ParkGalleryContainer parkId={park.id} />
    </div>
  );
};

export { ParkDetails };
