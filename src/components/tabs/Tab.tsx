import { NavLink } from 'react-router';
import classnames from 'classnames';
import styles from './Tab.module.scss';

interface TabProps {
  url: string;
  text: string;
  disabled?: boolean;
  end?: boolean;
}

const Tab: React.FC<TabProps> = ({
  url,
  text,
  disabled = false,
  end = true,
}) => {
  return (
    <NavLink
      prefetch="viewport"
      end={end}
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
