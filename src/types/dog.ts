type dogsSize = 'large' | 'medium' | 'small';
type dogsEnergy = 'high' | 'medium' | 'low';

interface Dog {
  id: string;
  name: string;
  age?: number;
  size?: dogsSize;
  breed?: string;
  temperament?: string;
  likes?: string[];
  dislikes?: string[];
  description?: string;
  possessive?: string;
  energy?: dogsEnergy;
  owner: string;
}

export type { Dog };
