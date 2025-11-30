import { ChangeEvent, useContext, useState } from 'react';
import classnames from 'classnames';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { MoveLeft, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LeafletMouseEvent } from 'leaflet';
import { Location, NewParkDetails } from '../types/park';
import { createParkSuggestion } from '../services/park-suggestions';
import { UserContext } from '../context/UserContext';
import { Button } from '../components/Button';
import { LocationInput } from '../components/inputs/LocationInput';
import { Input } from '../components/inputs/Input';
import { TopModal } from '../components/modals/TopModal';
import { PrevLinks } from '../components/PrevLinks';
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
  const { t } = useTranslation();

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
      setError(t('login.missingDetails'));
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
      <PrevLinks
        links={{
          to: '/parks',
          icon: <MoveLeft size={16} />,
          text: t('newPark.breadcrumbAllParks'),
        }}
      />
      <div className={styles.container}>
        <div className={styles.contentContainer}>
          <div className={styles.title}>{t('newPark.fillDetailsTitle')}</div>
          <div className={classnames(styles.error, error && styles.show)}>
            {error}
          </div>
          <div className={styles.inputsContainer}>
            <Input
              placeholder={t('newPark.placeholderName')}
              name="name"
              value={parkDetails.name}
              onChange={onChangeParkDetails}
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder={t('newPark.placeholderSize')}
              name="size"
              value={parkDetails.size}
              onChange={onChangeParkDetails}
            />
            <Input
              placeholder={t('newPark.placeholderCity')}
              name="city"
              value={parkDetails.city}
              onChange={onChangeParkDetails}
            />
            <Input
              placeholder={t('newPark.placeholderAddress')}
              name="address"
              value={parkDetails.address}
              onChange={onChangeParkDetails}
            />
            <LocationInput
              label={t('newPark.labelLocation')}
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
              {t('newPark.addButton')}
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
          <span>{t('newPark.onlyMembers')}</span>
          <span>
            <Link to="/login?mode=login">{t('newPark.loginLink')}</Link>{' '}
            {t('newPark.packInvite')}
          </span>
          <Button
            variant="secondary"
            className={styles.button}
            onClick={() => setIsModalOpen(false)}
          >
            {t('newPark.exit')}
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
            <span>{t('newPark.finishThankYou')}</span>
            <span>{t('newPark.finishAddedSoon')}</span>
            <span>{t('newPark.finishAddAnother')}</span>
          </div>
          <div className={styles.buttonsContainer}>
            <Button className={styles.button} onClick={onClickAddAnotherPark}>
              <Plus size={16} />
              <span>{t('newPark.finishAddButton')}</span>
            </Button>
            <Button
              variant="secondary"
              className={styles.button}
              onClick={onClickBackToParks}
            >
              <MoveLeft size={16} />
              <span>{t('newPark.finishBackToParks')}</span>
            </Button>
          </div>
        </div>
      </TopModal>
    </>
  );
};

export default NewPark;
