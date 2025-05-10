import { InputHTMLAttributes, forwardRef } from 'react';
import classnames from 'classnames';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        (event.target as HTMLInputElement).blur();
      }
    };

    return (
      <input
        onKeyDown={handleKeyDown}
        className={classnames(styles.input, className)}
        {...props}
        ref={ref}
      />
    );
  }
);

export { Input };
