import { ChangeEvent, useContext, useState } from 'react';
import classnames from 'classnames';
import { Link, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { LeafletMouseEvent } from 'leaflet';
import { Location, NewParkDetails } from '../types/park';
import { Button } from '../components/Button';
import { LocationInput } from '../components/inputs/LocationInput';
import { createParkSuggestion } from '../services/park-suggestions';
import { UserContext } from '../context/UserContext';
import { Input } from '../components/inputs/Input';
import { MoveLeft } from 'lucide-react';
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

  const { mutate } = useMutation({
    mutationFn: createParkSuggestion,
    onSuccess: async () => {
      navigate('/parks');
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
              placeholder="Park Name"
              name="name"
              value={parkDetails.name}
              onChange={onChangeParkDetails}
            />
            <Input
              type="number"
              placeholder="Size in meters (if known)"
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
              label="Click on the map to set the park location *"
              markerLocation={markerLocation}
              onMapClick={onMapClick}
              className={styles.map}
            />
            <Button
              onClick={onAddPark}
              className={styles.button}
              disabled={
                !markerLocation || !parkDetails.address || !parkDetails.city
              }
            >
              Add Park
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
          <span>Only Klavhub members can add a new park.</span>
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
    </>
  );
};

export { NewPark };
