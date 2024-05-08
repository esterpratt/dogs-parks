import classnames from 'classnames';
import { Dog } from '../../types/dog';
import styles from './DogDetails.module.scss';
import { DogsTabs } from './DogsTabs';
import { Button } from '../Button';
import { MouseEvent, useMemo } from 'react';
import { TableRow } from '../table/TableRow';

interface DogProps {
  dogs: Dog[];
  currentDogId: string;
  setCurrentDogId: (id: string) => void;
  onEditDog: (event: MouseEvent<HTMLButtonElement>) => void;
  userName?: string;
  className?: string;
  isSignedInUser: boolean;
}

const DogDetails: React.FC<DogProps> = ({
  dogs,
  currentDogId,
  setCurrentDogId,
  isSignedInUser,
  onEditDog,
  userName,
  className,
}) => {
  const currentDog = dogs.find((dog) => dog.id === currentDogId);

  const dogDetailsTextMap = useMemo(
    () => [
      { label: 'Age', data: currentDog?.age },
      { label: 'Breed', data: currentDog?.breed },
      { label: 'Size', data: currentDog?.size },
      { label: 'Temperament', data: currentDog?.temperament },
      { label: 'Energy', data: currentDog?.energy },
      { label: 'Possessive', data: currentDog?.possessive },
      { label: 'Likes', data: currentDog?.likes?.join(', ') },
      { label: 'dislikes', data: currentDog?.dislikes?.join(', ') },
      {
        label: `More About ${currentDog?.name}`,
        data: currentDog?.description,
      },
    ],
    [currentDog]
  );

  if (!currentDog) {
    return null;
  }

  const existedData = dogDetailsTextMap.filter((detail) => detail.data);

  return (
    <div className={classnames(styles.container, className)}>
      {dogs.length > 1 && (
        <DogsTabs
          dogs={dogs}
          setCurrentDogId={setCurrentDogId}
          currentDogId={currentDogId}
        />
      )}
      {(!dogs.length || !existedData.length) && (
        <Button
          className={styles.content}
          onClick={isSignedInUser ? onEditDog : () => {}}
        >
          {isSignedInUser
            ? `Add your dog's details`
            : `${userName} did not add their dog's details yet`}
        </Button>
      )}
      {!!dogs.length && !!existedData.length && (
        <table className={styles.details}>
          <tbody>
            {existedData.map((rowData, index) => {
              return <TableRow key={index} columns={Object.values(rowData)} />;
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export { DogDetails };
