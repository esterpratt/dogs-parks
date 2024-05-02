import { useOutletContext } from 'react-router';
import { Accordion } from '../components/Accordion/Accordion';
import { AccordionContent } from '../components/Accordion/AccordionContent';
import { AccordionTitle } from '../components/Accordion/AccordionTitle';
import { BusyHours } from '../components/park/BusyHours';
import { ParkGallery } from '../components/park/ParkGallery';
import { Park } from '../types/park';
import { ParkGenerals } from '../components/park/ParkGenerals';

const ParkDetails = () => {
  const park = useOutletContext<Park>();

  return (
    <div>
      <Accordion>
        <AccordionTitle>More about this park</AccordionTitle>
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
        <AccordionTitle>Busy hours</AccordionTitle>
        <AccordionContent>
          <BusyHours parkId={park.id} />
        </AccordionContent>
      </Accordion>
      <Accordion>
        <AccordionTitle>Gallery</AccordionTitle>
        <AccordionContent>
          <ParkGallery parkId={park.id} />
        </AccordionContent>
      </Accordion>
    </div>
  );
};

export { ParkDetails };
