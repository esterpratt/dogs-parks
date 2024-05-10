import { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import classnames from 'classnames';
import styles from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  variant?: 'Basic' | 'orange';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'basic',
  className,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      className={classnames(styles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
