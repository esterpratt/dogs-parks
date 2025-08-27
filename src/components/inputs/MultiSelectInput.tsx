import { ChangeEvent, ReactNode } from 'react';
import classnames from 'classnames';
import styles from './RadioInput.module.scss';

interface MultiSelectInputProps {
  name: string;
  value: string;
  id: string;
  isChecked: boolean;
  onOptionChange: (event: ChangeEvent<HTMLInputElement>) => void;
  icon?: ReactNode;
  className?: string;
}

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
  name,
  value,
  id,
  isChecked,
  onOptionChange,
  icon,
  className,
}) => {
  return (
    <div
      className={classnames(
        styles.input,
        isChecked && styles.checked,
        className
      )}
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        id={id}
        checked={isChecked}
        onChange={onOptionChange}
      />
      <label htmlFor={id}>
        {!!icon && icon}
        <span>{value}</span>
      </label>
    </div>
  );
};

export { MultiSelectInput };
