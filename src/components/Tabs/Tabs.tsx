import { Tab } from './Tab';
import styles from './Tabs.module.scss';

interface TabsProps {
  tabs: {
    text: string;
    url: string;
    disabled?: boolean;
  }[];
}

const Tabs: React.FC<TabsProps> = ({ tabs }) => {
  return (
    <div className={styles.container}>
      {tabs.map(({ text, url, disabled }) => (
        <Tab key={url} text={text} url={url} disabled={disabled} />
      ))}
    </div>
  );
};

export { Tabs };
