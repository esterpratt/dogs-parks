import { ChangeEvent } from 'react';
import { MultiSelectInput } from './MultiSelectInput';
import styles from './RadioInputs.module.scss';

interface MultiSelectInputsProps {
  options: { id: string; value: string; label?: string }[];
  name: string;
  label: string;
  value?: string[];
  onInputChange: (
    event: ChangeEvent<HTMLInputElement>,
    value: string[]
  ) => void;
  inputClassName?: string;
}

const MultiSelectInputs: React.FC<MultiSelectInputsProps> = ({
  options,
  name,
  value = [],
  label,
  onInputChange,
  inputClassName,
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
              className={inputClassName}
              key={option.id}
              name={name}
              id={option.id}
              value={option.value}
              label={option.label}
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
