import { useState } from 'react';
import { Button } from '../Button';

interface DogsCountProps {
  onSubmitDogsCount: (dogsCount: string) => void;
}

const DogsCount: React.FC<DogsCountProps> = ({ onSubmitDogsCount }) => {
  const [dogsCount, setDogsCount] = useState<string>('');

  return (
    <>
      <span>How many dogs are there with you?</span>
      <input
        type="number"
        min={0}
        max={99}
        value={dogsCount}
        onChange={(event) => setDogsCount(event.currentTarget.value)}
      />
      <Button
        onClick={() => onSubmitDogsCount(dogsCount)}
        disabled={!dogsCount && dogsCount !== '0'}
      >
        Submit Report
      </Button>
    </>
  );
};

export { DogsCount };
