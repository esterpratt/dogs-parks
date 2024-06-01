import { ChangeEvent, FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../Button';
import styles from './EditPark.module.scss';
import { ControlledInput } from '../inputs/ControlledInput';
import { RadioInputs } from '../inputs/RadioInputs';
import { Park, ParkMaterial } from '../../types/park';
import { MultiSelectInputs } from '../inputs/MultiSelectInputs';
import { updatePark } from '../../services/parks';
import { queryClient } from '../../services/react-query';

interface EditParkProps {
  onSubmitForm?: () => void;
  park: Park;
}

const EditPark: React.FC<EditParkProps> = ({ onSubmitForm, park }) => {
  const [parkDetails, setParkDetails] = useState<{
    materials?: ParkMaterial[];
    size?: string;
    hasShade?: string;
    hasWater?: string;
  }>(() => {
    return {
      size: park.size?.toString(),
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
      hasWater?: boolean;
    } = {};

    const materials = parkDetails.materials ? parkDetails.materials : undefined;
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
      {park.hasShade === undefined && (
        <RadioInputs
          value={parkDetails.hasShade || ''}
          options={[
            { value: 'yes', id: 'yes' },
            { value: 'no', id: 'no' },
          ]}
          onOptionChange={onInputChange}
          name="hasShade"
        />
      )}
      {park.hasWater === undefined && (
        <RadioInputs
          value={parkDetails.hasWater || ''}
          options={[
            { value: 'yes', id: 'yes' },
            { value: 'no', id: 'no' },
          ]}
          onOptionChange={onInputChange}
          name="hasWater"
        />
      )}
      <Button variant="green" type="submit" className={styles.saveButton}>
        Save
      </Button>
    </form>
  );
};

export { EditPark };
