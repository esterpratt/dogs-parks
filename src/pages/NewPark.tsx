import { ChangeEvent, useState } from 'react';
import styles from './NewPark.module.scss';
import classnames from 'classnames';
import { Location, NewParkDetails } from '../types/park';
import { ControlledInput } from '../components/inputs/ControlledInput';
import { Button } from '../components/Button';
import { LocationInput } from '../components/inputs/LocationInput';
import { createPark } from '../services/parks';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../services/react-query';
import { LeafletMouseEvent } from 'leaflet';
import { addParkEvent } from '../services/events';

const NewPark: React.FC = () => {
  const [markerLocation, setMarkerLocation] = useState<Location | null>(null);
  const [parkDetails, setParkDetails] = useState({
    name: '',
    city: '',
    address: '',
    size: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { mutate } = useMutation({
    mutationFn: createPark,
    onSuccess: async (_data, vars: NewParkDetails) => {
      queryClient.invalidateQueries({
        queryKey: ['parks'],
      });
      addParkEvent(vars);
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
      latitude: event.latlng.lat,
      longitude: event.latlng.lng,
    });
  };

  const onCancel = () => {
    navigate('/parks');
  };

  const onAddPark = async () => {
    if (!markerLocation || !parkDetails.address || !parkDetails.city) {
      setError('Please fill in the missing details');
    } else {
      const newPark: NewParkDetails = {
        name: parkDetails.name || parkDetails.address,
        address: parkDetails.address,
        city: parkDetails.city,
        location: {
          latitude: markerLocation.latitude,
          longitude: markerLocation.longitude,
        },
      };
      if (parkDetails.size) {
        newPark.size = Number(parkDetails.size);
      }
      mutate(newPark);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>Fill the park details to add it</div>
      <div className={classnames(styles.error, error && styles.show)}>
        {error}
      </div>
      <div className={styles.inputsContainer}>
        <ControlledInput
          label="Park Name"
          name="name"
          value={parkDetails.name}
          onChange={onChangeParkDetails}
        />
        <ControlledInput
          label="City *"
          name="city"
          value={parkDetails.city}
          onChange={onChangeParkDetails}
        />
        <ControlledInput
          label="Address *"
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
        <ControlledInput
          type="number"
          label="Size in meters (if known)"
          name="size"
          value={parkDetails.size}
          onChange={onChangeParkDetails}
        />
        <div className={styles.buttons}>
          <Button
            variant="green"
            onClick={onAddPark}
            className={styles.button}
            disabled={
              !markerLocation || !parkDetails.address || !parkDetails.city
            }
          >
            Add Park
          </Button>
          <Button variant="orange" onClick={onCancel} className={styles.button}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export { NewPark };
