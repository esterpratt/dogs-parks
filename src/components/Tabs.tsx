import { Tab } from './Tab';
import styles from './Tabs.module.scss';

interface TabsProps {
  tabs: {
    text: string;
    url: string;
  }[];
}

const Tabs: React.FC<TabsProps> = ({ tabs }) => {
  return (
    <div className={styles.container}>
      {tabs.map(({ text, url }) => (
        <Tab key={url} text={text} url={url} />
      ))}
    </div>
  );
};

export { Tabs };
