import classnames from 'classnames';
import styles from './Loading.module.scss';

interface LoadingProps {
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ className }) => {
  return (
    <div className={classnames(styles.container, className)}>Loading...</div>
  );
};

export { Loading };
