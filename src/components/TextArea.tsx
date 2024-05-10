import { ChangeEvent } from 'react';
import styles from './TextArea.module.scss';

interface TextAreaProps {
  value: string;
  name: string;
  label: string;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  label,
  name,
  rows,
  maxLength,
  placeholder,
}) => {
  return (
    <div className={styles.container}>
      <label htmlFor={name}>{label}</label>
      <textarea
        placeholder={placeholder}
        maxLength={maxLength || 180}
        rows={rows || 3}
        value={value}
        onChange={onChange}
        name={name}
        id={name}
      />
    </div>
  );
};

export { TextArea };
