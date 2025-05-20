import {
  NativeSettings,
  AndroidSettings,
  IOSSettings,
} from 'capacitor-native-settings';
import { useState } from 'react';
import { useUserLocation } from '../context/LocationContext';
import { Button } from './Button';
import styles from './LocationPermissionModal.module.scss';

const LocationPermissionModal = () => {
  const isLocationDenied = useUserLocation((state) => state.isLocationDenied);

  const dismissedForever =
    localStorage.getItem('locationModalDismissed') === 'true';
  const dismissedThisSession =
    sessionStorage.getItem('locationModalDismissed') === 'true';

  const [showModal, setShowModal] = useState(
    !dismissedForever && !dismissedThisSession
  );

  if (!isLocationDenied || !showModal) return null;

  const openAppSettings = () => {
    NativeSettings.open({
      optionAndroid: AndroidSettings.ApplicationDetails,
      optionIOS: IOSSettings.App,
    });
  };

  const handleCancel = () => {
    sessionStorage.setItem('locationModalDismissed', 'true');
    setShowModal(false);
  };

  const handleCancelForGood = () => {
    localStorage.setItem('locationModalDismissed', 'true');
    setShowModal(false);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.content}>
        <p className={styles.text}>
          We couldn’t access your location. You can enable location permissions
          in your device settings.
        </p>
        <div className={styles.buttonsContainer}>
          <Button className={styles.button} onClick={openAppSettings}>
            Open settings
          </Button>
          <Button
            className={styles.button}
            variant="secondary"
            onClick={handleCancel}
          >
            Maybe later
          </Button>
          <Button
            className={styles.button}
            variant="secondary"
            color={styles.red}
            onClick={handleCancelForGood}
          >
            Don't show again
          </Button>
        </div>
      </div>
    </div>
  );
};

export { LocationPermissionModal };
