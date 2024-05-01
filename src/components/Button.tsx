import { MouseEvent, ReactNode } from 'react';
import classnames from 'classnames';
import styles from './Button.module.scss';

interface ButtonProps {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  variant?: 'Basic';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'basic',
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={classnames(styles[variant], className)}
    >
      {children}
    </button>
  );
};

export { Button };
