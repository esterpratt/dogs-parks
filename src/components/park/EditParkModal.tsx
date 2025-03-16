import { ChangeEvent, useState } from 'react';
import { Park, ParkMaterial } from '../../types/park';
import { Modal } from '../Modal';
import styles from './EditParkModal.module.scss';
import { useThankYouModalContext } from '../../context/ThankYouModalContext';
import { useMutation } from '@tanstack/react-query';
import { updatePark } from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { ControlledInput } from '../inputs/ControlledInput';
import { MultiSelectInputs } from '../inputs/MultiSelectInputs';
import { RadioInputs } from '../inputs/RadioInputs';
import { RangeInput } from '../inputs/RangeInput';
import { useOrientationContext } from '../../context/OrientationContext';

interface EditParksModalProps {
  isOpen: boolean;
  onClose: () => void;
  park: Park;
}

const getBooleanValue = (value: string | null) => {
  if (value === 'Y') {
    return true;
  }

  if (value === 'N') {
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
  const setIsThankYouModalOpen = useThankYouModalContext(
    (state) => state.setIsOpen
  );
  const [parkDetails, setParkDetails] = useState<{
    materials: ParkMaterial[] | null;
    hasFacilities: string | null;
    size: string | null;
    shade: string | null;
    hasWater: string | null;
  }>(() => {
    return {
      size: park.size?.toString() || null,
      shade: park.shade?.toString() || null,
      hasFacilities:
        park.has_facilities === false ? 'N' : park.has_facilities ? 'Y' : null,
      materials: park.materials,
      hasWater: park.has_water === false ? 'N' : park.has_water ? 'Y' : null,
    };
  });

  const { mutate } = useMutation({
    mutationFn: (data: { id: string; updatedData: Partial<Park> }) =>
      updatePark(data.id, data.updatedData),
    onMutate: async (data) => {
      onClose();

      await queryClient.cancelQueries({ queryKey: ['parks', park.id] });
      const prevPark = queryClient.getQueryData<Park>(['parks', park.id]);
      queryClient.setQueryData(['parks', park.id], {
        ...prevPark,
        ...data.updatedData,
      });

      return { prevPark };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(['parks', park.id], context?.prevPark);
    },
    onSuccess: () => {
      setIsThankYouModalOpen(true);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parks', park.id] });
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
      has_water?: boolean | null;
    } = {
      materials: [],
      size: null,
      shade: null,
      has_facilities: null,
      has_water: null,
    };

    const materials = parkDetails.materials ? parkDetails.materials : [];
    const hasFacilities = getBooleanValue(parkDetails.hasFacilities);
    const shade = parkDetails.shade !== null ? Number(parkDetails.shade) : null;
    const hasWater = getBooleanValue(parkDetails.hasWater);
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
    if (hasWater !== null) {
      updatedData.has_water = hasWater;
    }
    if (hasFacilities !== null) {
      updatedData.has_facilities = hasFacilities;
    }

    mutate({ id: park.id, updatedData });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      height={orientation === 'landscape' ? '98%' : '95%'}
      onSave={onSubmit}
      className={styles.modalContent}
    >
      <div className={styles.title}>
        Can you help us with missing details about this park?
      </div>
      <form className={styles.form}>
        <div className={styles.formInputs}>
          {!park.size && (
            <ControlledInput
              type="number"
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
                { value: 'Y', id: 'yes' },
                { value: 'N', id: 'no' },
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
            />
          )}
          {park.has_water === null && (
            <RadioInputs
              value={parkDetails.hasWater || ''}
              options={[
                { value: 'Y', id: 'yes' },
                { value: 'N', id: 'no' },
              ]}
              onOptionChange={onInputChange}
              name="hasWater"
              label="Contains Drinking Fountains?"
            />
          )}
        </div>
      </form>
    </Modal>
  );
};
