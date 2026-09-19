import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRevalidator } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Park,
  ParkMaterial,
  ParkSizeCategory,
  UpdateParkDetails,
} from '../../types/park';
import { updatePark } from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { MultiSelectInputs } from '../inputs/MultiSelectInputs';
import { RadioInputs } from '../inputs/RadioInputs';
import { RangeInput } from '../inputs/RangeInput';
import { useOrientationContext } from '../../context/OrientationContext';
import { useNotification } from '../../context/NotificationContext';
import { FormModal } from '../modals/FormModal';
import styles from './EditParkModal.module.scss';

interface EditParksModalProps {
  isOpen: boolean;
  onClose: () => void;
  park: Park;
}

const getBooleanValue = (value: string | null) => {
  if (value === 'Yes') {
    return true;
  }

  if (value === 'No') {
    return false;
  }

  return null;
};

const EditParkModal: React.FC<EditParksModalProps> = ({
  isOpen,
  onClose,
  park,
}) => {
  const { t } = useTranslation();
  const orientation = useOrientationContext((state) => state.orientation);
  const { revalidate } = useRevalidator();
  const { notify } = useNotification();
  const [parkDetails, setParkDetails] = useState<{
    materials: ParkMaterial[] | null;
    hasFacilities: string | null;
    sizeCategory: ParkSizeCategory | null;
    shade: string | null;
  }>(() => {
    return {
      sizeCategory: park.size_category,
      shade: park.shade?.toString() || null,
      hasFacilities:
        park.has_facilities === false
          ? 'No'
          : park.has_facilities
            ? 'Yes'
            : null,
      materials: park.materials,
    };
  });

  // Wait for the server to confirm the update before closing the modal or showing success.
  const { mutate, isPending } = useMutation({
    mutationFn: (data: { id: string; updatedData: UpdateParkDetails }) =>
      updatePark(data.id, data.updatedData),
    onError: () => {
      notify(t('toasts.generic.error'), true);
    },
    onSuccess: () => {
      onClose();
      notify();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['park', park.id] });
      revalidate();
    },
  });

  const onInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string | number | string[]
  ) => {
    setParkDetails((prev) => {
      return {
        ...prev,
        [event.target.name]: value || event.target.value,
      };
    });
  };

  // Stores the selected category as one of the database enum values.
  const onSizeCategoryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setParkDetails((previousParkDetails) => {
      return {
        ...previousParkDetails,
        sizeCategory: event.target.value as ParkSizeCategory,
      };
    });
  };

  const onSubmit = () => {
    if (isPending) {
      return;
    }

    const updatedData: UpdateParkDetails = {};

    const materials = parkDetails.materials ? parkDetails.materials : [];
    const hasFacilities = getBooleanValue(parkDetails.hasFacilities);
    const shade = parkDetails.shade !== null ? Number(parkDetails.shade) : null;

    if (parkDetails.sizeCategory !== null) {
      updatedData.size_category = parkDetails.sizeCategory;
    }

    if (shade !== null) {
      updatedData.shade = shade;
    }

    if (materials.length) {
      updatedData.materials = materials;
    }

    if (hasFacilities !== null) {
      updatedData.has_facilities = hasFacilities;
    }

    // Avoid calling the RPC when the user has not supplied any missing detail.
    if (Object.keys(updatedData).length === 0) {
      return;
    }

    mutate({ id: park.id, updatedData });
  };

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      height={orientation === 'landscape' ? 98 : null}
      onSave={onSubmit}
      isPending={isPending}
      className={styles.modal}
      title={t('parks.edit.modal.title')}
      titleClassName={styles.title}
    >
      <form className={styles.form}>
        {park.size_category === null && (
          <RadioInputs
            name="sizeCategory"
            label={t('parks.edit.modal.sizeCategory')}
            value={parkDetails.sizeCategory || ''}
            onOptionChange={onSizeCategoryChange}
            options={[
              {
                id: 'park-size-small',
                value: ParkSizeCategory.SMALL,
                label: t('parks.about.sizeLabel.small'),
              },
              {
                id: 'park-size-medium',
                value: ParkSizeCategory.MEDIUM,
                label: t('parks.about.sizeLabel.medium'),
              },
              {
                id: 'park-size-large',
                value: ParkSizeCategory.LARGE,
                label: t('parks.about.sizeLabel.large'),
              },
              {
                id: 'park-size-huge',
                value: ParkSizeCategory.HUGE,
                label: t('parks.about.sizeLabel.huge'),
              },
            ]}
          />
        )}
        {!park.materials?.length && (
          <MultiSelectInputs
            inputClassName={styles.input}
            options={[
              {
                id: ParkMaterial.SAND,
                value: ParkMaterial.SAND,
                label: t('parks.about.groundOptions.SAND'),
              },
              {
                id: ParkMaterial.DIRT,
                value: ParkMaterial.DIRT,
                label: t('parks.about.groundOptions.DIRT'),
              },
              {
                id: ParkMaterial.GRASS,
                value: ParkMaterial.GRASS,
                label: t('parks.about.groundOptions.GRASS'),
              },
              {
                id: ParkMaterial.SYNTHETIC_GRASS,
                value: ParkMaterial.SYNTHETIC_GRASS,
                label: t('parks.about.groundOptions.SYNTHETIC_GRASS'),
              },
            ]}
            value={parkDetails.materials || []}
            onInputChange={onInputChange}
            name="materials"
            label={t('parks.edit.modal.groundCovering')}
          />
        )}
        {park.has_facilities === null && (
          <RadioInputs
            value={parkDetails.hasFacilities || ''}
            options={[
              { value: 'Yes', label: t('parks.about.boolean.yes'), id: 'yes' },
              { value: 'No', label: t('parks.about.boolean.no'), id: 'no' },
            ]}
            onOptionChange={onInputChange}
            name="hasFacilities"
            label={t('parks.edit.modal.containsFacilities')}
          />
        )}
        {park.shade === null && (
          <RangeInput
            label={t('parks.edit.modal.dailyShadeHours')}
            name="shade"
            value={parkDetails.shade?.toString() || ''}
            onChange={onInputChange}
            className={styles.range}
          />
        )}
      </form>
    </FormModal>
  );
};

export { EditParkModal };
