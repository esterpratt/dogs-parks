import { ChangeEvent, useState } from 'react';
import { Park, ParkMaterial } from '../../types/park';
import { useMutation } from '@tanstack/react-query';
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
  const orientation = useOrientationContext((state) => state.orientation);
  const { notify } = useNotification();
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

    if (size !== null) {
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

    mutate({ id: park.id, updatedData });
  };

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      height={orientation === 'landscape' ? 98 : null}
      onSave={onSubmit}
      className={styles.modal}
      title="Add the following park details"
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
            label="Size (in meters)"
          />
        )}
        {!park.materials?.length && (
          <MultiSelectInputs
            options={[
              { id: ParkMaterial.SAND, value: ParkMaterial.SAND },
              { id: ParkMaterial.DIRT, value: ParkMaterial.DIRT },
              { id: ParkMaterial.GRASS, value: ParkMaterial.GRASS },
              {
                id: ParkMaterial.SYNTHETIC_GRASS,
                value: ParkMaterial.SYNTHETIC_GRASS,
              },
            ]}
            value={parkDetails.materials || []}
            onInputChange={onInputChange}
            name="materials"
            label="Ground Covering"
          />
        )}
        {park.has_facilities === null && (
          <RadioInputs
            value={parkDetails.hasFacilities || ''}
            options={[
              { value: 'Yes', id: 'yes' },
              { value: 'No', id: 'no' },
            ]}
            onOptionChange={onInputChange}
            name="hasFacilities"
            label="Contains Facilities?"
          />
        )}
        {park.shade === null && (
          <RangeInput
            label="Daily Shade Hours"
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
