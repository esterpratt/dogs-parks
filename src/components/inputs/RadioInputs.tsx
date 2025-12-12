import { ChangeEvent } from 'react';
import { RadioInput } from './RadioInput';
import styles from './RadioInputs.module.scss';

interface RadioInputProps {
  options: { id: string; value: string; label?: string }[];
  name: string;
  label: string;
  value: string;
  inputClassName?: string;
  onOptionChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const RadioInputs: React.FC<RadioInputProps> = ({
  options,
  name,
  label,
  value,
  onOptionChange,
  inputClassName,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.name}>{label}</div>
      <div className={styles.options}>
        {options.map((option) => {
          return (
            <RadioInput
              className={inputClassName}
              key={option.id}
              name={name}
              id={option.id}
              value={option.value}
              label={option.label}
              selectedValue={value}
              onOptionChange={onOptionChange}
            />
          );
        })}
      </div>
    </div>
  );
};

export { RadioInputs };
