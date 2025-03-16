interface Review {
  id: string;
  user_id: string | null;
  park_id: string;
  title: string;
  content?: string;
  rank: number;
  created_at?: Date;
  updated_at?: Date;
}

type ReviewData = Pick<Review, 'title' | 'content' | 'rank'>;

export type { Review, ReviewData };
