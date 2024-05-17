interface Review {
  id: string;
  userId: string | null;
  parkId: string;
  title: string;
  content?: string;
  rank: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type { Review };
