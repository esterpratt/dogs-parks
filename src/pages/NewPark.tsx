import { ChangeEvent, useContext, useState } from 'react';
import classnames from 'classnames';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { LeafletMouseEvent } from 'leaflet';
import { Location, NewParkDetails } from '../types/park';
import { Button } from '../components/Button';
import { LocationInput } from '../components/inputs/LocationInput';
import { createParkSuggestion } from '../services/park-suggestions';
import { UserContext } from '../context/UserContext';
import { Input } from '../components/inputs/Input';
import { MoveLeft, Plus } from 'lucide-react';
import { TopModal } from '../components/modals/TopModal';
import styles from './NewPark.module.scss';

const NewPark: React.FC = () => {
  const [markerLocation, setMarkerLocation] = useState<Location | null>(null);
  const [parkDetails, setParkDetails] = useState({
    name: '',
    city: '',
    address: '',
    size: '',
  });
  const [error, setError] = useState('');
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

  const { mutate } = useMutation({
    mutationFn: createParkSuggestion,
    onSuccess: async () => {
      setIsFinishModalOpen(true);
    },
  });

  const onChangeParkDetails = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    setParkDetails((prev) => {
      return {
        ...prev,
        [event.target.name]: event.target.value,
      };
    });
  };

  const onMapClick = (event: LeafletMouseEvent) => {
    setMarkerLocation({
      lat: event.latlng.lat,
      long: event.latlng.lng,
    });
  };

  const handleSetCurrentLocation = (location: Location) => {
    setMarkerLocation(location);
  };

  const onAddPark = async () => {
    if (!user?.id) {
      setIsModalOpen(true);
    } else if (!markerLocation || !parkDetails.address || !parkDetails.city) {
      setError('Please fill in the missing details');
    } else {
      const newPark: NewParkDetails = {
        name: parkDetails.name || parkDetails.address,
        address: parkDetails.address,
        city: parkDetails.city,
        location: {
          lat: markerLocation.lat,
          long: markerLocation.long,
        },
        user_id: user.id,
        size: parkDetails.size ? Number(parkDetails.size) : null,
      };

      mutate(newPark);
    }
  };

  const onClickBackToParks = () => {
    setIsFinishModalOpen(false);
    navigate('/parks');
  };

  const onClickAddAnotherPark = () => {
    setIsFinishModalOpen(false);
    setParkDetails({
      name: '',
      city: '',
      address: '',
      size: '',
    });
    setMarkerLocation(null);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.prevLinks}>
          {
            <Link to="/parks">
              <MoveLeft size={16} />
              <span>All parks</span>
            </Link>
          }
        </div>
        <div className={styles.contentContainer}>
          <div className={styles.title}>Fill the park details to add it</div>
          <div className={classnames(styles.error, error && styles.show)}>
            {error}
          </div>
          <div className={styles.inputsContainer}>
            <Input
              placeholder="Park name"
              name="name"
              value={parkDetails.name}
              onChange={onChangeParkDetails}
            />
            <Input
              type="number"
              placeholder="Size in square meters (if known)"
              name="size"
              value={parkDetails.size}
              onChange={onChangeParkDetails}
            />
            <Input
              placeholder="City *"
              name="city"
              value={parkDetails.city}
              onChange={onChangeParkDetails}
            />
            <Input
              placeholder="Address *"
              name="address"
              value={parkDetails.address}
              onChange={onChangeParkDetails}
            />
            <LocationInput
              label="Park location *"
              markerLocation={markerLocation}
              onMapClick={onMapClick}
              className={styles.map}
              onSetCurrentLocation={handleSetCurrentLocation}
            />
            <Button
              onClick={onAddPark}
              className={styles.button}
              disabled={
                !markerLocation || !parkDetails.address || !parkDetails.city
              }
            >
              Add park
            </Button>
          </div>
        </div>
      </div>
      <TopModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className={styles.modal}
      >
        <div className={styles.modalContainer}>
          <span>Only KlavHubers can add a new park.</span>
          <span>
            <Link to="/login?mode=login">Log In</Link> to be part of the pack!
          </span>
          <Button
            variant="secondary"
            className={styles.button}
            onClick={() => setIsModalOpen(false)}
          >
            Exit
          </Button>
        </div>
      </TopModal>
      <TopModal
        open={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        className={styles.finishModal}
      >
        <div className={styles.finishModalContainer}>
          <div className={styles.text}>
            <span>Thank you!</span>
            <span>The park will be added shortly.</span>
            <span>Want to add another one?</span>
          </div>
          <div className={styles.buttonsContainer}>
            <Button className={styles.button} onClick={onClickAddAnotherPark}>
              <Plus size={16} />
              <span>Add park</span>
            </Button>
            <Button
              variant="secondary"
              className={styles.button}
              onClick={onClickBackToParks}
            >
              <MoveLeft size={16} />
              <span>Back to parks</span>
            </Button>
          </div>
        </div>
      </TopModal>
    </>
  );
};

export default NewPark;
