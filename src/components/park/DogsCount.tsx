import { useState } from 'react';

interface DogsCountProps {
  onSubmitDogsCount: (dogsCount: string) => void;
}

const DogsCount: React.FC<DogsCountProps> = ({ onSubmitDogsCount }) => {
  const [dogsCount, setDogsCount] = useState<string>('');

  return (
    <>
      <p>How many dogs are there with you?</p>
      <input
        type="number"
        min={0}
        value={dogsCount}
        onChange={(event) => setDogsCount(event.currentTarget.value)}
      />
      <button
        onClick={() => onSubmitDogsCount(dogsCount)}
        disabled={!dogsCount && dogsCount !== '0'}
      >
        Submit Report
      </button>
    </>
  );
};

export { DogsCount };
