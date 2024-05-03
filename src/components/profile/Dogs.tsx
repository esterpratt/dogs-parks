import { Dog as DogType } from '../../types/dog';
import { Dog } from './Dog';

interface DogsProps {
  dogs: DogType[];
}

const Dogs: React.FC<DogsProps> = ({ dogs }) => {
  if (!dogs?.length) {
    return null;
  }
  return (
    <div>
      {dogs.map((dog) => (
        <Dog key={dog.id} dog={dog} />
      ))}
    </div>
  );
};

export { Dogs };
