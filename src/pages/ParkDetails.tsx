import { useContext, useState } from 'react';
import { useOutletContext } from 'react-router';
import { Accordion } from '../components/accordion/Accordion';
import { BusyHours } from '../components/park/BusyHours';
import { Park } from '../types/park';
import { ParkGenerals } from '../components/park/ParkGenerals';
import { ParkGalleryContainer } from '../components/park/ParkGalleryContainer';
import { UserContext } from '../context/UserContext';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { EditParkModal } from '../components/park/EditParkModal';

const ParkDetails = () => {
  const park = useOutletContext<Park>();
  const { userId } = useContext(UserContext);
  const isEditable =
    !!userId &&
    (!park.size || !park.materials?.length || !park.hasShade || !park.hasWater);
  const [isEditParkModalOpen, setIsEditParkModalOpen] = useState(false);

  return (
    <div>
      <Accordion>
        <Accordion.TitleWithIcon
          title="More about this park"
          showIcon={isEditable}
          Icon={MdOutlineModeEditOutline}
          onClickIcon={() => setIsEditParkModalOpen(true)}
          iconSize={18}
        />
        <Accordion.Content>
          <ParkGenerals
            size={park.size}
            ground={park.materials}
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

export default ParkDetails;
