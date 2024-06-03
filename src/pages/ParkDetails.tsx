import { useContext, useState } from 'react';
import { useOutletContext } from 'react-router';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { Accordion } from '../components/accordion/Accordion';
import { BusyHours } from '../components/park/BusyHours';
import { Park } from '../types/park';
import { ParkGenerals } from '../components/park/ParkGenerals';
import { ParkGalleryContainer } from '../components/park/ParkGalleryContainer';
import { UserContext } from '../context/UserContext';
import { ChooseEditParkOptionModal } from '../components/park/ChooseEditParkOptionModal';

const ParkDetails = () => {
  const park = useOutletContext<Park>();
  const { userId } = useContext(UserContext);
  const [isEditParkModalOpen, setIsEditParkModalOpen] = useState(false);

  return (
    <div>
      <Accordion>
        <Accordion.TitleWithIcon
          title="Get the scoop on the park"
          showIcon={!!userId}
          Icon={MdOutlineModeEditOutline}
          onClickIcon={() => setIsEditParkModalOpen(true)}
          iconSize={18}
        />
        <Accordion.Content>
          <ParkGenerals
            parkId={park.id}
            size={park.size}
            ground={park.materials}
            facilities={park.hasFacilities}
            shade={park.hasShade}
            water={park.hasWater}
          />
        </Accordion.Content>
      </Accordion>
      <Accordion>
        <Accordion.Title>
          {(isOpen) => (
            <>
              Busy hours
              <Accordion.Arrow isOpen={isOpen} />
            </>
          )}
        </Accordion.Title>
        <Accordion.Content>
          <BusyHours parkId={park.id} />
        </Accordion.Content>
      </Accordion>
      {!!userId && (
        <ChooseEditParkOptionModal
          isOpen={isEditParkModalOpen}
          onClose={() => setIsEditParkModalOpen(false)}
          park={park}
        />
      )}
      <ParkGalleryContainer parkId={park.id} />
    </div>
  );
};

export default ParkDetails;
