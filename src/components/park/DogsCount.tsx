import { useState } from 'react';
import { Button } from '../Button';
import { ControlledInput } from '../ControlledInput';

interface DogsCountProps {
  onSubmitDogsCount: (dogsCount: string) => void;
}

const DogsCount: React.FC<DogsCountProps> = ({ onSubmitDogsCount }) => {
  const [dogsCount, setDogsCount] = useState<string>('');

  return (
    <>
      <ControlledInput
        type="number"
        name="dogsCount"
        label="How many dogs are there with you?"
        min={0}
        max={99}
        value={dogsCount}
        onChange={(event) => setDogsCount(event.currentTarget.value)}
      />
      <Button
        variant="orange"
        onClick={() => onSubmitDogsCount(dogsCount)}
        disabled={!dogsCount && dogsCount !== '0'}
      >
        Submit
      </Button>
    </>
  );
};

export { DogsCount };
