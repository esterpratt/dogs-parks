import { useContext, useState, lazy, Suspense } from 'react';
import { useOutletContext } from 'react-router';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { BusyHours } from '../components/park/BusyHours';
import { Park } from '../types/park';
import { ParkGenerals } from '../components/park/ParkGenerals';
import { ParkGalleryContainer } from '../components/park/ParkGalleryContainer';
import { UserContext } from '../context/UserContext';
import { Loading } from '../components/Loading';
import { AccordionContainer } from '../components/accordionCmps/AccordionContainer';

const ChooseEditParkOptionModal = lazy(
  () => import('../components/park/ChooseEditParkOptionModal')
);

const ParkDetails = () => {
  const park = useOutletContext<Park>();
  const { userId } = useContext(UserContext);
  const [isEditParkModalOpen, setIsEditParkModalOpen] = useState(false);

  return (
    <div>
      <AccordionContainer>
        <AccordionContainer.TitleWithIcon
          title="Get the scoop on the park"
          showIcon={!!userId}
          Icon={MdOutlineModeEditOutline}
          onClickIcon={() => setIsEditParkModalOpen(true)}
          iconSize={18}
        />
        <AccordionContainer.Content>
          <ParkGenerals
            parkId={park.id}
            size={park.size}
            ground={park.materials}
            facilities={park.hasFacilities}
            shade={park.hasShade}
            water={park.hasWater}
          />
        </AccordionContainer.Content>
      </AccordionContainer>
      <AccordionContainer>
        <AccordionContainer.Title>
          {(isOpen: boolean) => (
            <>
              Busy hours
              <AccordionContainer.Arrow isOpen={isOpen} />
            </>
          )}
        </AccordionContainer.Title>
        <AccordionContainer.Content>
          <BusyHours parkId={park.id} />
        </AccordionContainer.Content>
      </AccordionContainer>
      {!!userId && (
        <Suspense fallback={<Loading />}>
          <ChooseEditParkOptionModal
            isOpen={isEditParkModalOpen}
            onClose={() => setIsEditParkModalOpen(false)}
            park={park}
          />
        </Suspense>
      )}
      <ParkGalleryContainer parkId={park.id} />
    </div>
  );
};

export default ParkDetails;
