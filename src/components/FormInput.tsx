import classnames from 'classnames';
import { Input } from './Input';
import styles from './FormInput.module.scss';

interface FormInputProps extends React.HTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  variant?: 'basic' | 'singleLine';
  defaultValue?: string | number;
}

const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  type = 'text',
  required,
  variant = 'basic',
  defaultValue,
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
        {...props}
      />
    </div>
  );
};

export { FormInput };
