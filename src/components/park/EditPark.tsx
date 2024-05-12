import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { Button } from '../Button';
import styles from './EditPark.module.scss';
import { ControlledInput } from '../ControlledInput';
import { RadioInputs } from '../RadioInputs';
import { Park, ParkMaterial } from '../../types/park';
import { MultiSelectInputs } from '../MultiSelectInputs';
import { ParksContext } from '../../context/ParksContext';

interface EditParkProps {
  onSubmitForm?: () => void;
  park: Park;
}

const EditPark: React.FC<EditParkProps> = ({ onSubmitForm, park }) => {
  const { editPark } = useContext(ParksContext);
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

  // TODO: move to action?
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

    await editPark(park.id, updatedData);

    if (onSubmitForm) {
      onSubmitForm();
    }
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
      <Button variant="orange" type="submit" className={styles.saveButton}>
        Save
      </Button>
    </form>
  );
};

export { EditPark };
