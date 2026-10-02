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
  birthday?: Date;
  gender?: GENDER;
  size?: DOG_SIZE;
  breed?: string;
  temperament?: string;
  likes?: string[];
  dislikes?: string[];
  description?: string;
  possessive?: string;
  energy?: DOG_ENERGY;
  primaryImage?: string;
  primary_image_id?: string | null;
  owner: string;
}

export type { Dog };
export { DOG_ENERGY, DOG_SIZE, GENDER };
