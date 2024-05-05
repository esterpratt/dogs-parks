import classnames from 'classnames';
import { Dog } from '../../types/dog';
import styles from './DogDetails.module.scss';

interface DogProps {
  dogs: Dog[];
  currentDogId: string;
  setCurrentDogId: (id: string) => void;
  className?: string;
}

const DogDetails: React.FC<DogProps> = ({
  dogs,
  currentDogId,
  setCurrentDogId,
  className,
}) => {
  const currentDog = dogs.find((dog) => dog.id === currentDogId);
  if (!currentDog) {
    return null;
  }
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
    <div className={classnames(styles.container, className)}>
      {dogs.length > 1 && (
        <div className={styles.dogTabs}>
          {dogs.map((dog) => (
            <span
              key={dog.id}
              onClick={() => setCurrentDogId(dog.id)}
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
      <table className={styles.details}>
        <tbody>
          <tr>
            <td>
              <div>Age</div>
            </td>
            <td>
              <div>{age}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div>Breed</div>
            </td>
            <td>
              <div>{breed || '?'}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div>Size</div>
            </td>
            <td>
              <div>{size || '?'}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div>Temperament</div>
            </td>
            <td>
              <div>{temperament || '?'}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div>Energy</div>
            </td>
            <td>
              <div>{energy || '?'}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div>Possessive</div>
            </td>
            <td>
              <div>{possessive || '?'}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div>Likes</div>
            </td>
            <td>
              <div>{likes?.length ? likes?.join(', ') : '?'}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div>Dislikes</div>
            </td>
            <td>
              <div>{dislikes?.length ? dislikes?.join(', ') : '?'}</div>
            </td>
          </tr>
          {description && (
            <tr>
              <td>
                <div>More about {name}</div>
              </td>
              <td>
                <div>{description}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export { DogDetails };
