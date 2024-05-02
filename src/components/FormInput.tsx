import { Input } from './Input';
import styles from './FormInput.module.scss';

interface FormInputProps extends React.HTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  type: string;
}

const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  type,
  ...props
}) => {
  return (
    <div>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      <Input id={name} type={type} name={name} required {...props} />
    </div>
  );
};

export { FormInput };
