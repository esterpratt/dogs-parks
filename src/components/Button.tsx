import { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import classnames from 'classnames';
import styles from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'simple' | 'round';
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  className,
  color = '',
  style = {},
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      className={classnames(styles.button, styles[variant], className)}
      style={{ ...style, '--color': color }}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
