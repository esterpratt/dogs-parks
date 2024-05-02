import { NavLink } from 'react-router-dom';
import classnames from 'classnames';
import styles from './Tab.module.scss';

interface TabProps {
  url: string;
  text: string;
}

const Tab: React.FC<TabProps> = ({ url, text }) => {
  return (
    <NavLink
      end={true}
      to={url}
      className={({ isActive }: { isActive: boolean }) =>
        classnames(isActive ? styles.active : '', styles.link)
      }
    >
      {text}
    </NavLink>
  );
};

export { Tab };
