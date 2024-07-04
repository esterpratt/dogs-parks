import { ChangeEvent, useContext, useState } from 'react';
import { Park, ParkMaterial } from '../../types/park';
import { Modal } from '../Modal';
import styles from './EditParkModal.module.scss';
import { ThankYouModalContext } from '../../context/ThankYouModalContext';
import { useMutation } from '@tanstack/react-query';
import { updatePark } from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { ControlledInput } from '../inputs/ControlledInput';
import { MultiSelectInputs } from '../inputs/MultiSelectInputs';
import { RadioInputs } from '../inputs/RadioInputs';
import { RangeInput } from '../inputs/RangeInput';

interface EditParksModalProps {
  isOpen: boolean;
  onClose: () => void;
  park: Park;
}

const getBooleanValue = (value?: string) => {
  if (value === 'Y') {
    return true;
  }

  if (value === 'N') {
    return false;
  }

  return undefined;
};

const EditParkModal: React.FC<EditParksModalProps> = ({
  isOpen,
  onClose,
  park,
}) => {
  const { setIsOpen: setIsThankYouModalOpen } =
    useContext(ThankYouModalContext);
  const [parkDetails, setParkDetails] = useState<{
    materials?: ParkMaterial[];
    hasFacilities?: string;
    size?: string;
    shade?: string;
    hasWater?: string;
  }>(() => {
    return {
      size: park.size?.toString(),
      shade: park.shade?.toString(),
      hasFacilities:
        park.hasFacilities === false
          ? 'N'
          : park.hasFacilities
          ? 'Y'
          : undefined,
      materials: park.materials,
      hasWater: park.hasWater === false ? 'N' : park.hasWater ? 'Y' : undefined,
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
      materials?: ParkMaterial[];
      size?: number;
      shade?: number;
      hasFacilities?: boolean;
      hasWater?: boolean;
    } = {};

    const materials = parkDetails.materials ? parkDetails.materials : undefined;
    const hasFacilities = getBooleanValue(parkDetails.hasFacilities);
    const shade =
      parkDetails.shade !== undefined ? Number(parkDetails.shade) : undefined;
    const hasWater = getBooleanValue(parkDetails.hasWater);
    const size =
      parkDetails.size !== undefined ? Number(parkDetails.size) : undefined;

    if (size !== undefined) {
      updatedData.size = size;
    }
    if (shade !== undefined) {
      updatedData.shade = shade;
    }
    if (materials?.length) {
      updatedData.materials = materials;
    }
    if (hasWater !== undefined) {
      updatedData.hasWater = hasWater;
    }
    if (hasFacilities !== undefined) {
      updatedData.hasFacilities = hasFacilities;
    }

    mutate({ id: park.id, updatedData });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      height="90%"
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
          {!park.materials && (
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
          {park.hasFacilities === undefined && (
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
          {park.shade === undefined && (
            <RangeInput
              label="Daily Shade Hours"
              name="shade"
              value={parkDetails.shade?.toString() || ''}
              onChange={onInputChange}
            />
          )}
          {park.hasWater === undefined && (
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

export default EditParkModal;
