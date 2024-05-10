import { ChangeEvent } from 'react';
import { RadioInput } from './RadioInput';
import styles from './RadioInputs.module.scss';

interface RadioInputProps {
  options: { id: string; value: string }[];
  name: string;
  value: string;
  onOptionChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const RadioInputs: React.FC<RadioInputProps> = ({
  options,
  name,
  value,
  onOptionChange,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.name}>{name}</div>
      {options.map((option) => {
        return (
          <RadioInput
            key={option.id}
            name={name}
            id={option.id}
            value={option.value}
            selectedValue={value}
            onOptionChange={onOptionChange}
          />
        );
      })}
    </div>
  );
};

export { RadioInputs };
