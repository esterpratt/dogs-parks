import { InputHTMLAttributes } from 'react';
import styles from './ControlledInput.module.scss';
import { Input } from './Input';

interface ControlledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  label: string;
  name: string;
  placeholder?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ControlledInput: React.FC<ControlledInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  name,
  ...props
}) => {
  return (
    <div className={styles.container}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <Input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};

export { ControlledInput };
