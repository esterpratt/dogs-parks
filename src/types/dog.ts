type DogSize = 'large' | 'medium' | 'small';
type DogEnergy = 'high' | 'medium' | 'low';
type Gender = 'female' | 'male';

interface Dog {
  id: string;
  name: string;
  age?: number;
  gender?: Gender;
  size?: DogSize;
  breed?: string;
  temperament?: string;
  likes?: string[];
  dislikes?: string[];
  description?: string;
  possessive?: string;
  energy?: DogEnergy;
  owner: string;
}

export type { Dog };
