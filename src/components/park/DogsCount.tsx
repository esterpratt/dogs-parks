import { useState } from 'react';
import { Button } from '../Button';
import { ControlledInput } from '../inputs/ControlledInput';
import styles from './DogsCount.module.scss';

interface DogsCountProps {
  onSubmitDogsCount: (dogsCount: string) => void;
}

const DogsCount: React.FC<DogsCountProps> = ({ onSubmitDogsCount }) => {
  const [dogsCount, setDogsCount] = useState<string>('');

  return (
    <div className={styles.container}>
      <ControlledInput
        type="number"
        name="dogsCount"
        label="How many dogs are with you?"
        min={0}
        max={99}
        value={dogsCount}
        onChange={(event) => setDogsCount(event.currentTarget.value)}
      />
      <Button
        variant="green"
        onClick={() => onSubmitDogsCount(dogsCount)}
        disabled={!dogsCount && dogsCount !== '0'}
      >
        Submit
      </Button>
    </div>
  );
};

export { DogsCount };
