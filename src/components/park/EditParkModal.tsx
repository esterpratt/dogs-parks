import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRevalidator } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Park, ParkMaterial } from '../../types/park';
import { updatePark } from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { ControlledInput } from '../inputs/ControlledInput';
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

export const EditParkModal: React.FC<EditParksModalProps> = ({
  isOpen,
  onClose,
  park,
}) => {
  const { t } = useTranslation();
  const orientation = useOrientationContext((state) => state.orientation);
  const { revalidate } = useRevalidator();
  const { notify } = useNotification();
  const [errors, setErrors] = useState<string[] | null>([]);
  const [parkDetails, setParkDetails] = useState<{
    materials: ParkMaterial[] | null;
    hasFacilities: string | null;
    size: string | null;
    shade: string | null;
  }>(() => {
    return {
      size: park.size?.toString() || null,
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

  const { mutate } = useMutation({
    mutationFn: (data: { id: string; updatedData: Partial<Park> }) =>
      updatePark(data.id, data.updatedData),
    onMutate: async (data) => {
      onClose();

      await queryClient.cancelQueries({ queryKey: ['park', park.id] });
      const prevPark = queryClient.getQueryData<Park>(['park', park.id]);
      queryClient.setQueryData(['park', park.id], {
        ...prevPark,
        ...data.updatedData,
      });

      return { prevPark };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(['park', park.id], context?.prevPark);
    },
    onSuccess: () => {
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
    setErrors(null);
    setParkDetails((prev) => {
      return {
        ...prev,
        [event.target.name]: value || event.target.value,
      };
    });
  };

  const onSubmit = async () => {
    const updatedData: {
      materials: ParkMaterial[];
      size?: number | null;
      shade?: number | null;
      has_facilities?: boolean | null;
    } = {
      materials: [],
      size: null,
      shade: null,
      has_facilities: null,
    };

    const materials = parkDetails.materials ? parkDetails.materials : [];
    const hasFacilities = getBooleanValue(parkDetails.hasFacilities);
    const shade = parkDetails.shade !== null ? Number(parkDetails.shade) : null;
    const size = parkDetails.size !== null ? Number(parkDetails.size) : null;
    const curErrors = [];

    if (size !== null) {
      if (size < 10) {
        curErrors.push('Size must be greater than 10');
      }
      updatedData.size = size;
    }
    if (shade !== null) {
      updatedData.shade = shade;
    }
    if (materials?.length) {
      updatedData.materials = materials;
    }
    if (hasFacilities !== null) {
      updatedData.has_facilities = hasFacilities;
    }

    if (curErrors.length) {
      setErrors(curErrors);
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
      className={styles.modal}
      title={t('parks.edit.modal.title')}
      titleClassName={styles.title}
    >
      <form className={styles.form}>
        {!park.size && (
          <ControlledInput
            type="number"
            inputMode="numeric"
            value={parkDetails.size?.toString() || ''}
            onChange={onInputChange}
            name="size"
            label={t('parks.edit.modal.sizeMeters')}
          />
        )}
        {!park.materials?.length && (
          <MultiSelectInputs
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
        <div className={styles.errors}>
          {!!errors?.length &&
            errors.map((error) => <span key={error}>{error}</span>)}
        </div>
      </form>
    </FormModal>
  );
};
