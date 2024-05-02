import { InputHTMLAttributes } from 'react';
import classnames from 'classnames';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  variant?: 'basic';
}

const Input: React.FC<InputProps> = ({
  className,
  variant = 'basic',
  ...props
}) => {
  return (
    <input
      className={classnames(
        styles.input,
        variant === 'basic' && styles.basic,
        className
      )}
      {...props}
    />
  );
};

export { Input };
