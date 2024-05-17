import styles from './Checkbox.module.scss';

interface CheckboxProps {
  isChecked: boolean;
  onChange: () => void;
  id: string;
  label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  onChange,
  id,
  label,
  isChecked,
}) => {
  return (
    <div className={styles.container}>
      <input
        id={id}
        name={id}
        type="checkbox"
        onChange={onChange}
        checked={!!isChecked}
        className={styles.input}
      />
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
    </div>
  );
};

export { Checkbox };
