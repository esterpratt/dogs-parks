import { useState } from 'react';
import classnames from 'classnames';
import { Dog } from '../../types/dog';
import styles from './DogDetails.module.scss';

interface DogProps {
  dogs: Dog[];
}

const DogDetails: React.FC<DogProps> = ({ dogs }) => {
  const [currentDog, setCurrentDog] = useState<Dog>(dogs[0]);
  const {
    age,
    breed,
    temperament,
    energy,
    possessive,
    likes,
    dislikes,
    description,
    size,
    name,
  } = currentDog;

  return (
    <div>
      {dogs.length > 1 && (
        <div className={styles.dogTabs}>
          {dogs.map((dog) => (
            <span
              key={dog.id}
              onClick={() => setCurrentDog(dog)}
              className={classnames(
                styles.dogTab,
                dog.id === currentDog.id && styles.current
              )}
            >
              {dog.name}
            </span>
          ))}
        </div>
      )}
      <table>
        <tr>
          <td>Age</td>
          <td>{age}</td>
        </tr>
        <tr>
          <td>Breed</td>
          <td>{breed || '?'}</td>
        </tr>
        <tr>
          <td>Size</td>
          <td>{size || '?'}</td>
        </tr>
        <tr>
          <td>Temperament</td>
          <td>{temperament || '?'}</td>
        </tr>
        <tr>
          <td>Energy</td>
          <td>{energy || '?'}</td>
        </tr>
        <tr>
          <td>Possessive?</td>
          <td>{possessive || '?'}</td>
        </tr>
        <tr>
          <td>Likes</td>
          <td>{likes?.length ? likes?.join(', ') : '?'}</td>
        </tr>
        <tr>
          <td>Dislikes</td>
          <td>{dislikes?.length ? dislikes?.join(', ') : '?'}</td>
        </tr>
        {description && (
          <tr>
            <td>More about {name}</td>
            <td>{description}</td>
          </tr>
        )}
      </table>
    </div>
  );
};

export { DogDetails };
