import { InputHTMLAttributes } from 'react';
import classnames from 'classnames';
import { Input } from './Input';
import styles from './ControlledInput.module.scss';

interface ControlledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  label: string;
  name: string;
  placeholder?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  variant?: 'basic' | 'singleLine';
  inputClassName?: string;
}

const ControlledInput: React.FC<ControlledInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  name,
  variant = 'basic',
  inputClassName,
  ...props
}) => {
  return (
    <div className={classnames(styles.container, styles[variant])}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <Input
        className={inputClassName}
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
