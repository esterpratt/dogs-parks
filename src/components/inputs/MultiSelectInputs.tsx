import { ChangeEvent } from 'react';
import styles from './RadioInputs.module.scss';
import { MultiSelectInput } from './MultiSelectInput';

interface MultiSelectInputsProps {
  options: { id: string; value: string }[];
  name: string;
  label: string;
  value?: string[];
  onInputChange: (
    event: ChangeEvent<HTMLInputElement>,
    value: string[]
  ) => void;
}

const MultiSelectInputs: React.FC<MultiSelectInputsProps> = ({
  options,
  name,
  value = [],
  label,
  onInputChange,
}) => {
  const onOptionChange = (
    event: ChangeEvent<HTMLInputElement>,
    optionValue: string
  ) => {
    if (value.includes(optionValue)) {
      onInputChange(
        event,
        value.filter((option) => option !== optionValue)
      );
    } else {
      onInputChange(event, [...value, optionValue]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.name}>{label}</div>
      <div className={styles.options}>
        {options.map((option) => {
          return (
            <MultiSelectInput
              key={option.id}
              name={name}
              id={option.id}
              value={option.value}
              isChecked={value.includes(option.value)}
              onOptionChange={(event) => onOptionChange(event, option.value)}
            />
          );
        })}
      </div>
    </div>
  );
};

export { MultiSelectInputs };
