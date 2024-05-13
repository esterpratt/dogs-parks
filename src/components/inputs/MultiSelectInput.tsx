import { ChangeEvent } from 'react';
import classnames from 'classnames';
import styles from './RadioInput.module.scss';

interface MultiSelectInputProps {
  name: string;
  value: string;
  id: string;
  isChecked: boolean;
  onOptionChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
  name,
  value,
  id,
  isChecked,
  onOptionChange,
}) => {
  return (
    <div className={classnames(styles.input, isChecked && styles.checked)}>
      <input
        type="checkbox"
        name={name}
        value={value}
        id={id}
        checked={isChecked}
        onChange={onOptionChange}
      />
      <label htmlFor={id}>{value}</label>
    </div>
  );
};

export { MultiSelectInput };
