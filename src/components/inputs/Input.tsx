import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import classnames from 'classnames';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, rightIcon, ...props }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        (event.target as HTMLInputElement).blur();
      }
    };

    return (
      <div className={classnames(styles.container)}>
        <input
          onKeyDown={handleKeyDown}
          className={classnames(styles.input, className)}
          {...props}
          ref={ref}
        />
        {!!rightIcon && <div className={styles.rightIcon}>{rightIcon}</div>}
      </div>
    );
  }
);

export { Input };
