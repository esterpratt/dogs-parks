import { ChangeEvent } from 'react';
import classnames from 'classnames';
import styles from './RadioInput.module.scss';

interface RadioInputsProps {
  name: string;
  value: string;
  id: string;
  selectedValue: string;
  onOptionChange: (event: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  className?: string;
}

const RadioInput: React.FC<RadioInputsProps> = ({
  name,
  value,
  id,
  selectedValue,
  onOptionChange,
  label,
  className,
}) => {
  return (
    <div
      className={classnames(
        styles.input,
        selectedValue === value && styles.checked,
        className
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
      <label htmlFor={id}>{label ?? value}</label>
    </div>
  );
};

export { RadioInput };
