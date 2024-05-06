import classnames from 'classnames';
import styles from './DogsTabs.module.scss';
import { Dog } from '../../types/dog';

interface DogsTabsProps {
  dogs: Dog[];
  currentDogId: string;
  setCurrentDogId: (id: string) => void;
}

const DogsTabs: React.FC<DogsTabsProps> = ({
  dogs,
  setCurrentDogId,
  currentDogId,
}) => {
  return (
    <div className={styles.dogTabs}>
      {dogs.map((dog) => (
        <span
          key={dog.id}
          onClick={() => setCurrentDogId(dog.id)}
          className={classnames(
            styles.dogTab,
            dog.id === currentDogId && styles.current
          )}
        >
          {dog.name}
        </span>
      ))}
    </div>
  );
};

export { DogsTabs };
