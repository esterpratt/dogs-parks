import classnames from 'classnames';
import { Input } from './Input';
import styles from './FormInput.module.scss';
import { ReactNode } from 'react';

interface FormInputProps extends React.HTMLAttributes<HTMLInputElement> {
  name: string;
  label: string | ReactNode;
  type?: string;
  required?: boolean;
  variant?: 'basic' | 'singleLine';
  defaultValue?: string;
  placeholder?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  type = 'text',
  required,
  variant = 'basic',
  defaultValue,
  placeholder,
  ...props
}) => {
  return (
    <div className={classnames(styles.container, styles[variant])}>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      <Input
        defaultValue={defaultValue}
        id={name}
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};

export { FormInput };
