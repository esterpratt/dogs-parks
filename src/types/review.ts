interface Review {
  userId: string;
  parkId: string;
  title: string;
  content?: string;
  rank: number;
  createdAt: Date;
  updatedAt?: Date;
}

export type { Review };
