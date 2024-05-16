import { ChangeEvent, useState } from 'react';
import styles from './NewPark.module.scss';
import classnames from 'classnames';
import { Location } from '../types/park';
import { ControlledInput } from '../components/inputs/ControlledInput';
import { Button } from '../components/Button';
import { LocationInput } from '../components/inputs/LocationInput';
import { createPark } from '../services/parks';

const NewPark: React.FC = () => {
  const [markerLocation, setMarkerLocation] = useState<Location | null>(null);
  const [parkDetails, setParkDetails] = useState({
    name: '',
    city: '',
    address: '',
    size: '',
  });
  const [error, setError] = useState('');

  const onChangeParkDetails = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    setParkDetails((prev) => {
      return {
        ...prev,
        [event.target.name]: event.target.value,
      };
    });
  };

  const onMapClick = (event: google.maps.MapMouseEvent) => {
    setMarkerLocation({
      latitude: event.latLng!.lat(),
      longitude: event.latLng!.lng(),
    });
  };

  const onAddPark = async () => {
    if (
      !markerLocation ||
      !parkDetails.name ||
      !parkDetails.address ||
      !parkDetails.city
    ) {
      setError('Please fill in the missing details');
    } else {
      const newPark: {
        name: string;
        city: string;
        address: string;
        size?: number;
        location: Location;
      } = {
        name: parkDetails.name,
        address: parkDetails.address,
        city: parkDetails.city,
        location: {
          latitude: markerLocation?.latitude,
          longitude: markerLocation.longitude,
        },
      };
      if (parkDetails.size) {
        newPark.size = Number(parkDetails.size);
      }
      await createPark(newPark);
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
          label="Park Name*"
          name="name"
          value={parkDetails.name}
          onChange={onChangeParkDetails}
        />
        <ControlledInput
          label="City*"
          name="city"
          value={parkDetails.city}
          onChange={onChangeParkDetails}
        />
        <ControlledInput
          label="Address*"
          name="address"
          value={parkDetails.address}
          onChange={onChangeParkDetails}
        />
        <LocationInput
          label="Click on the map to set the park location*"
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
        <Button variant="green" onClick={onAddPark} className={styles.button}>
          Add Park
        </Button>
      </div>
    </div>
  );
};

export { NewPark };
