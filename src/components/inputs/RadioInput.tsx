import { ChangeEvent } from 'react';
import classnames from 'classnames';
import styles from './RadioInput.module.scss';

interface RadioInputsProps {
  name: string;
  value: string;
  id: string;
  selectedValue: string;
  onOptionChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const RadioInput: React.FC<RadioInputsProps> = ({
  name,
  value,
  id,
  selectedValue,
  onOptionChange,
}) => {
  return (
    <div
      className={classnames(
        styles.input,
        selectedValue === value && styles.checked
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        id={id}
        checked={selectedValue === value}
        onChange={onOptionChange}
      />
      <label htmlFor={id}>{value}</label>
    </div>
  );
};

export { RadioInput };
