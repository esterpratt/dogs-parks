import { InputHTMLAttributes } from 'react';
import classnames from 'classnames';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return <input className={classnames(styles.input, className)} {...props} />;
};

export { Input };
