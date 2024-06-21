import { InputHTMLAttributes, forwardRef } from 'react';
import classnames from 'classnames';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={classnames(styles.input, className)}
        {...props}
        ref={ref}
      />
    );
  }
);

export { Input };
