// type DogSize = 'large' | 'medium' | 'small';
// type DogEnergy = 'high' | 'medium' | 'low';
// type Gender = 'female' | 'male';

enum DOG_SIZE {
  LARGE = 'large',
  MEDIUM = 'medium',
  SMALL = 'small',
}

enum DOG_ENERGY {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

enum GENDER {
  FEMALE = 'female',
  MALE = 'male',
}

interface Dog {
  id: string;
  name: string;
  age?: number;
  gender?: GENDER;
  size?: DOG_SIZE;
  breed?: string;
  temperament?: string;
  likes?: string[];
  dislikes?: string[];
  description?: string;
  possessive?: string;
  energy?: DOG_ENERGY;
  owner: string;
}

export type { Dog };
export { DOG_ENERGY, DOG_SIZE, GENDER };
