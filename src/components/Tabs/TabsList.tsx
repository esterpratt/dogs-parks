import classnames from 'classnames';
import { Tab } from './Tab';
import styles from './TabsList.module.scss';

interface TabsProps {
  tabs: {
    text: string;
    url: string;
    disabled?: boolean;
    end?: boolean;
  }[];
  className?: string;
}

const TabsList: React.FC<TabsProps> = ({ tabs, className }) => {
  return (
    <div className={classnames(styles.container, className)}>
      {tabs.map(({ text, url, disabled, end }) => (
        <Tab key={url} text={text} url={url} disabled={disabled} end={end} />
      ))}
    </div>
  );
};

export { TabsList };
