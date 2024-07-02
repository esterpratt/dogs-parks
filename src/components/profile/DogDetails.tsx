import classnames from 'classnames';
import { Dog } from '../../types/dog';
import styles from './DogDetails.module.scss';
import { Button } from '../Button';
import { MouseEvent, useMemo } from 'react';
import { TableRow } from '../table/TableRow';

interface DogProps {
  dog: Dog;
  onEditDog: (event: MouseEvent<HTMLButtonElement>) => void;
  userName?: string;
  className?: string;
  isSignedInUser: boolean;
}

const DogDetails: React.FC<DogProps> = ({
  dog,
  isSignedInUser,
  onEditDog,
  userName,
  className,
}) => {
  const dogDetailsTextMap = useMemo(
    () => [
      { label: 'Breed', data: dog.breed },
      { label: 'Size', data: dog.size },
      { label: 'Temperament', data: dog.temperament },
      { label: 'Energy', data: dog.energy },
      { label: 'Possessive', data: dog.possessive },
      { label: 'Likes', data: dog.likes?.join(', ') },
      { label: 'dislikes', data: dog.dislikes?.join(', ') },
      {
        label: `More About ${dog.name}`,
        data: dog.description,
      },
    ],
    [dog]
  );

  const existedData = dogDetailsTextMap.filter((detail) => detail.data);

  return (
    <div className={classnames(styles.container, className)}>
      {!existedData.length && (
        <Button
          className={styles.content}
          onClick={isSignedInUser ? onEditDog : () => {}}
        >
          {isSignedInUser
            ? `Add your dog's details`
            : <span className={styles.userName}>{userName}</span> +
              `did not add their dog's details yet`}
        </Button>
      )}
      {!!existedData.length && (
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
