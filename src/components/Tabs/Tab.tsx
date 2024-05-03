import { NavLink } from 'react-router-dom';
import classnames from 'classnames';
import styles from './Tab.module.scss';

interface TabProps {
  url: string;
  text: string;
  disabled?: boolean;
}

const Tab: React.FC<TabProps> = ({ url, text, disabled = false }) => {
  return (
    <NavLink
      end={true}
      to={url}
      className={({ isActive }: { isActive: boolean }) =>
        classnames(
          isActive && styles.active,
          styles.link,
          disabled && styles.disabled
        )
      }
    >
      {text}
    </NavLink>
  );
};

export { Tab };
