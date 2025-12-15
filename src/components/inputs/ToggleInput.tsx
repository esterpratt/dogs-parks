import { ReactNode } from 'react';
import classnames from 'classnames';
import styles from './ToggleInput.module.scss';

interface ToggleInputProps<T> {
  label?: string;
  value: T;
  valueOn: T;
  valueOff: T;
  onChange: (value: T) => void;
  iconOn?: ReactNode;
  iconOff?: ReactNode;
  variant?: 'large' | 'small';
}

export const ToggleInput = <T,>(props: ToggleInputProps<T>) => {
  const {
    label,
    value,
    valueOn,
    valueOff,
    onChange,
    iconOn = null,
    iconOff = null,
    variant = 'large',
  } = props;
  const isOn = value === valueOn;

  return (
    <label className={styles.toggleRow}>
      {label && <span className={styles.label}>{label}</span>}
      <div
        className={classnames(styles.switch, {
          [styles.small]: variant === 'small',
        })}
      >
        <input
          type="checkbox"
          checked={isOn}
          onChange={() => onChange(isOn ? valueOff : valueOn)}
        />
        <span className={styles.slider}>
          <span className={styles.icon}>{isOn ? iconOn : iconOff}</span>
        </span>
      </div>
    </label>
  );
};
