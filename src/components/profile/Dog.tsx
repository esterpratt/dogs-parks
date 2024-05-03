import { Dog as DogType } from '../../types/dog';

interface DogProps {
  dog: DogType;
}

const Dog: React.FC<DogProps> = ({ dog }) => {
  return (
    <div>
      <span>{dog.name}</span>
      <span>{dog.age}</span>
      <span>{dog.breed}</span>
      <span>{dog.size}</span>
      <span>{dog.description}</span>
      <span>{dog.temperament}</span>
      <span>{dog.energy}</span>
      <span>{dog.possessive}</span>
      <div>
        {dog.likes?.map((like) => (
          <span key={like}>{like}</span>
        ))}
      </div>
      <div>
        {dog.dislikes?.map((dislike) => (
          <span key={dislike}>{dislike}</span>
        ))}
      </div>
    </div>
  );
};

export { Dog };
