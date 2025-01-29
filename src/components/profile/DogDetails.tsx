import classnames from 'classnames';
import { Dog } from '../../types/dog';
import styles from './DogDetails.module.scss';
import { Button } from '../Button';
import { MouseEvent, useMemo } from 'react';
import { TableRow } from '../table/TableRow';
import { sanitizContent } from '../../utils/sanitize';

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
      { label: 'Temperament', data: sanitizContent(dog.temperament) },
      { label: 'Energy', data: dog.energy },
      { label: 'Possessive', data: sanitizContent(dog.possessive) },
      { label: 'Likes', data: sanitizContent(dog.likes?.join(', ')) },
      { label: 'Dislikes', data: sanitizContent(dog.dislikes?.join(', ')) },
      {
        label: `More About ${sanitizContent(dog.name)}`,
        data: sanitizContent(dog.description),
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
