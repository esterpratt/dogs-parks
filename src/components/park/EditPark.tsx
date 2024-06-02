import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../Button';
import styles from './EditPark.module.scss';
import { ControlledInput } from '../inputs/ControlledInput';
import { RadioInputs } from '../inputs/RadioInputs';
import { Park, ParkMaterial } from '../../types/park';
import { MultiSelectInputs } from '../inputs/MultiSelectInputs';
import { updatePark } from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { ThankYouModalContext } from '../../context/ThankYouModalContext';

interface EditParkProps {
  onSubmitForm?: () => void;
  park: Park;
}

const EditPark: React.FC<EditParkProps> = ({ onSubmitForm, park }) => {
  const { setIsOpen: setIsThankYouModalOpen } =
    useContext(ThankYouModalContext);
  const [parkDetails, setParkDetails] = useState<{
    materials?: ParkMaterial[];
    hasFacilities?: string;
    size?: string;
    hasShade?: string;
    hasWater?: string;
  }>(() => {
    return {
      size: park.size?.toString(),
      facilities:
        park.hasFacilities === false
          ? 'no'
          : park.hasFacilities
          ? 'yes'
          : undefined,
      materials: park.materials,
      hasShade:
        park.hasShade === false ? 'no' : park.hasShade ? 'yes' : undefined,
      hasWater:
        park.hasWater === false ? 'no' : park.hasWater ? 'yes' : undefined,
    };
  });

  const { mutate } = useMutation({
    mutationFn: (data: { id: string; updatedData: Partial<Park> }) =>
      updatePark(data.id, data.updatedData),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['parks', park.id] });
      const prevPark = queryClient.getQueryData<Park>(['parks', park.id]);
      queryClient.setQueryData(['parks', park.id], {
        ...prevPark,
        ...data.updatedData,
      });

      return { prevPark };
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(['parks', park.id], context?.prevPark);
    },
    onSuccess: () => {
      setIsThankYouModalOpen(true);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parks', park.id] });
      if (onSubmitForm) {
        onSubmitForm();
      }
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const updatedData: {
      materials?: ParkMaterial[];
      size?: number;
      hasShade?: boolean;
      hasFacilities?: boolean;
      hasWater?: boolean;
    } = {};

    const materials = parkDetails.materials ? parkDetails.materials : undefined;
    const hasFacilities =
      parkDetails.hasFacilities === 'yes'
        ? true
        : parkDetails.hasShade === 'no'
        ? false
        : undefined;
    const hasShade =
      parkDetails.hasShade === 'yes'
        ? true
        : parkDetails.hasShade === 'no'
        ? false
        : undefined;
    const hasWater =
      parkDetails.hasWater === 'yes'
        ? true
        : parkDetails.hasWater === 'no'
        ? false
        : undefined;
    const size =
      parkDetails.size !== undefined ? Number(parkDetails.size) : undefined;

    if (size !== undefined) {
      updatedData.size = size;
    }
    if (materials?.length) {
      updatedData.materials = materials;
    }
    if (hasShade !== undefined) {
      updatedData.hasShade = hasShade;
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
    <form onSubmit={onSubmit} className={styles.form}>
      {!park.size && (
        <ControlledInput
          type="number"
          value={parkDetails.size?.toString() || ''}
          onChange={onInputChange}
          name="size"
          label="Size"
        />
      )}
      {!park.materials && (
        <MultiSelectInputs
          options={[
            { id: ParkMaterial.SAND, value: ParkMaterial.SAND },
            { id: ParkMaterial.GRASS, value: ParkMaterial.GRASS },
          ]}
          value={parkDetails.materials || []}
          onInputChange={onInputChange}
          name="materials"
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
          label="Has Facilities?"
        />
      )}
      {park.hasShade === undefined && (
        <RadioInputs
          value={parkDetails.hasShade || ''}
          options={[
            { value: 'Y', id: 'yes' },
            { value: 'N', id: 'no' },
          ]}
          onOptionChange={onInputChange}
          name="hasShade"
          label="Has Shade?"
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
          label="Has Water?"
        />
      )}
      <Button variant="green" type="submit" className={styles.saveButton}>
        Save
      </Button>
    </form>
  );
};

export { EditPark };
